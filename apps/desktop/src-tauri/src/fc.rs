use anyhow::Result as AnyResult;
use chrono::{DateTime, Local};
use mf_utils::is_supported_file_name;
use natural_sort_rs::Natural;
use serde::{Deserialize, Serialize};
use std::fs;
use std::future::Future;
use std::path::Path;

use crate::task_system::error::SystemError;

// #[warn(dead_code)]
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileInfo {
    name: String,
    kind: String,
    path: String,
    children: Option<Vec<FileInfo>>,
    ext: String,
}

#[derive(Serialize, Deserialize)]
pub struct Post {
    title: String,
    created: String,
    link: String,
    description: String,
    content: String,
    author: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum FileResultCode {
    Success = 0,
    NotFound = -1,
    PermissionDenied = -2,
    InvalidPath = -3,
    UnknownError = -99,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileResult {
    pub code: FileResultCode,
    pub content: String,
}

fn is_hidden_file_name(file_name: &str) -> bool {
    file_name.starts_with('.')
}

pub fn read_directory(dir_path: &str) -> Result<Vec<FileInfo>, FileResultCode> {
    // 同步版本保留，作为兼容性接口
    let new_path = Path::new(dir_path);
    let paths = match fs::read_dir(new_path) {
        Ok(paths) => paths,
        Err(e) => {
            return match e.kind() {
                std::io::ErrorKind::NotFound => Err(FileResultCode::NotFound),
                std::io::ErrorKind::PermissionDenied => Err(FileResultCode::PermissionDenied),
                _ => Err(FileResultCode::UnknownError),
            };
        }
    };

    let mut files: Vec<FileInfo> = Vec::new();

    for path in paths {
        let path_unwrap = match path {
            Ok(p) => p,
            Err(_) => continue,
        };

        let meta = match path_unwrap.metadata() {
            Ok(m) => m,
            Err(_) => continue,
        };

        let mut kind = String::from("file");
        let mut children: Option<Vec<FileInfo>> = None;

        let filename = match path_unwrap.file_name().into_string() {
            Ok(str) => str,
            Err(_) => continue,
        };

        if is_hidden_file_name(&filename) {
            continue;
        }

        let file_path = new_path.join(filename.clone());
        let ext = file_path.extension();
        let file_ext = match ext {
            Some(ext) => ext.to_str().unwrap_or("").to_string(),
            None => String::from(""),
        };

        if meta.is_dir() {
            kind = String::from("dir");
            children = match read_directory(file_path.to_str().unwrap_or("")) {
                Ok(children) => Some(children),
                Err(_) => None,
            };
        }

        let new_file_info = FileInfo {
            name: filename,
            kind,
            path: file_path.to_str().unwrap_or("").to_string(),
            children,
            ext: file_ext.into(),
        };

        if is_supported_file_name(&new_file_info.name) || meta.is_dir() {
            files.push(new_file_info);
        }
    }

    sort_files_by_kind_and_name(&mut files);
    Ok(files)
}

// 新增异步版本，使用task_system
pub fn read_directory_async(
    dir_path: String,
) -> impl Future<Output = Result<Vec<FileInfo>, SystemError>> {
    use crate::task_system::{
        error::SystemError,
        system::System,
        task::{ExecStatus, Interrupter, Task, TaskId, TaskOutput},
    };
    use async_trait::async_trait;
    use thiserror::Error;

    #[derive(Debug, Error)]
    enum ReadDirError {
        #[error("File error: {0:?}")]
        FileError(FileResultCode),
        #[error("System error: {0}")]
        SystemError(#[from] SystemError),
    }

    #[derive(Debug)]
    struct ReadDirectoryTask {
        id: TaskId,
        dir_path: String,
    }

    impl ReadDirectoryTask {
        fn new(dir_path: String) -> Self {
            Self {
                id: TaskId::new_v4(),
                dir_path,
            }
        }
    }

    #[async_trait]
    impl Task<ReadDirError> for ReadDirectoryTask {
        fn id(&self) -> TaskId {
            self.id
        }

        fn with_priority(&self) -> bool {
            // 文件读取任务通常需要优先处理
            true
        }

        async fn run(&mut self, _interrupter: &Interrupter) -> Result<ExecStatus, ReadDirError> {
            // 执行实际的目录读取操作
            match read_directory(&self.dir_path) {
                Ok(files) => Ok(ExecStatus::Done(TaskOutput::Out(Box::new(files)))),
                Err(e) => Err(ReadDirError::FileError(e)),
            }
        }
    }

    async move {
        // 创建任务系统实例
        let system = System::<ReadDirError>::new();

        // 创建目录读取任务并分发
        let task = ReadDirectoryTask::new(dir_path);
        let handle = system
            .dispatch(task)
            .await
            .map_err(|_| SystemError::TaskAborted(TaskId::nil()))?;

        // 等待任务完成并处理结果
        match handle.await {
            Ok(crate::task_system::task::TaskStatus::Done((_, TaskOutput::Out(out)))) => {
                // 将AnyTaskOutput转换回Vec<FileInfo>
                let files = out
                    .downcast::<Vec<FileInfo>>()
                    .map_err(|_| SystemError::TaskAborted(TaskId::nil()))?;
                Ok(*files)
            }
            Ok(crate::task_system::task::TaskStatus::Done((_, TaskOutput::Empty))) => {
                Ok(Vec::new())
            }
            Ok(crate::task_system::task::TaskStatus::Error(ReadDirError::FileError(_fc))) => {
                // 使用TaskJoin替代不存在的TaskFailed
                Err(SystemError::TaskJoin(TaskId::nil()))
            }
            Ok(crate::task_system::task::TaskStatus::Error(ReadDirError::SystemError(e))) => Err(e),
            Ok(crate::task_system::task::TaskStatus::Canceled) => {
                Err(SystemError::TaskAborted(TaskId::nil()))
            }
            Ok(crate::task_system::task::TaskStatus::ForcedAbortion) => {
                Err(SystemError::TaskAborted(TaskId::nil()))
            }
            Ok(crate::task_system::task::TaskStatus::Shutdown(_)) => {
                Err(SystemError::TaskAborted(TaskId::nil()))
            }
            Err(e) => Err(e),
        }
    }
}

pub fn sort_files_by_kind_and_name(files: &mut Vec<FileInfo>) {
    use std::cmp::Ordering;

    files.sort_by(|a, b| {
        // 1. 首先按类型排序（文件夹优先）
        if a.kind != b.kind {
            return if a.kind == "dir" {
                Ordering::Less
            } else {
                Ordering::Greater
            };
        }

        if Natural::str(a.name.clone()) < Natural::str(b.name.clone()) {
            Ordering::Less
        } else if Natural::str(a.name.clone()) > Natural::str(b.name.clone()) {
            Ordering::Greater
        } else {
            Ordering::Equal
        }
    });
}

pub fn files_to_json(files: Vec<FileInfo>) -> FileResult {
    match serde_json::to_string(&files) {
        Ok(content) => FileResult {
            code: FileResultCode::Success,
            content,
        },
        Err(e) => FileResult {
            code: FileResultCode::UnknownError,
            content: format!("Failed to serialize files: {}", e),
        },
    }
}

pub fn read_file(path: &str) -> FileResult {
    match fs::read_to_string(path) {
        Ok(content) => FileResult {
            code: FileResultCode::Success,
            content,
        },
        Err(e) => {
            let code = match e.kind() {
                std::io::ErrorKind::NotFound => FileResultCode::NotFound,
                std::io::ErrorKind::PermissionDenied => FileResultCode::PermissionDenied,
                _ => FileResultCode::UnknownError,
            };
            FileResult {
                code,
                content: format!("Failed to read file: {}", e),
            }
        }
    }
}

// update file and create new file
pub fn write_file(path: &str, content: &str) -> FileResult {
    let file_path = Path::new(path);
    match fs::write(file_path, content) {
        Ok(()) => FileResult {
            code: FileResultCode::Success,
            content: String::from("File written successfully"),
        },
        Err(e) => {
            let code = match e.kind() {
                std::io::ErrorKind::NotFound => FileResultCode::NotFound,
                std::io::ErrorKind::PermissionDenied => FileResultCode::PermissionDenied,
                _ => FileResultCode::UnknownError,
            };
            FileResult {
                code,
                content: format!("Failed to write file: {}", e),
            }
        }
    }
}

pub fn exists(path: &Path) -> bool {
    Path::new(path).exists()
}

pub fn create_file<P: AsRef<Path>>(filename: P) -> FileResult {
    let filename = filename.as_ref();
    if let Some(parent) = filename.parent() {
        if !parent.exists() {
            if let Err(e) = fs::create_dir_all(parent) {
                return FileResult {
                    code: FileResultCode::UnknownError,
                    content: format!("Failed to create parent directories: {}", e),
                };
            }
        }
    }
    match fs::File::create(filename) {
        Ok(_) => FileResult {
            code: FileResultCode::Success,
            content: String::from("File created successfully"),
        },
        Err(e) => {
            let code = match e.kind() {
                std::io::ErrorKind::PermissionDenied => FileResultCode::PermissionDenied,
                _ => FileResultCode::UnknownError,
            };
            FileResult {
                code,
                content: format!("Failed to create file: {}", e),
            }
        }
    }
}

pub fn create_folder(path: &str) -> FileResult {
    let dir_path = Path::new(path);
    match fs::create_dir(dir_path) {
        Ok(()) => FileResult {
            code: FileResultCode::Success,
            content: String::from(""),
        },
        Err(e) => {
            let code = match e.kind() {
                std::io::ErrorKind::AlreadyExists => FileResultCode::InvalidPath,
                std::io::ErrorKind::PermissionDenied => FileResultCode::PermissionDenied,
                _ => FileResultCode::UnknownError,
            };
            FileResult {
                code,
                content: format!("Failed to create folder: {}", e),
            }
        }
    }
}

pub fn remove_file(path: &str) -> FileResult {
    let file_path = Path::new(path);
    match fs::remove_file(file_path) {
        Ok(()) => FileResult {
            code: FileResultCode::Success,
            content: String::from("File removed successfully"),
        },
        Err(e) => {
            let code = match e.kind() {
                std::io::ErrorKind::NotFound => FileResultCode::NotFound,
                std::io::ErrorKind::PermissionDenied => FileResultCode::PermissionDenied,
                _ => FileResultCode::UnknownError,
            };
            FileResult {
                code,
                content: format!("Failed to remove file: {}", e),
            }
        }
    }
}

pub fn remove_folder(path: &str) -> FileResult {
    let folder_path = Path::new(path);
    match fs::remove_dir_all(folder_path) {
        Ok(()) => FileResult {
            code: FileResultCode::Success,
            content: String::from("Folder removed successfully"),
        },
        Err(e) => {
            let code = match e.kind() {
                std::io::ErrorKind::NotFound => FileResultCode::NotFound,
                std::io::ErrorKind::PermissionDenied => FileResultCode::PermissionDenied,
                _ => FileResultCode::UnknownError,
            };
            FileResult {
                code,
                content: format!("Failed to remove folder: {}", e),
            }
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MoveFileInfo {
    old_path: String,
    new_path: String,
    children: Option<Vec<FileInfo>>,
    is_folder: bool,
    is_replaced: Option<bool>,
}

pub fn rename_fs(old_path: &Path, new_path: &Path) -> AnyResult<MoveFileInfo> {
    fs::rename(old_path, new_path)?;

    let is_folder = new_path.is_dir();

    if is_folder {
        let res = read_directory(new_path.to_str().unwrap_or(""));

        let files: Option<Vec<FileInfo>> = match res {
            Ok(files) => Some(files),
            Err(_) => None,
        };
        if files.is_none() {
            return Err(anyhow::anyhow!("Failed to read directory"));
        }

        Ok(MoveFileInfo {
            old_path: old_path.to_str().unwrap_or("").to_string(),
            new_path: new_path.to_str().unwrap_or("").to_string(),
            is_folder: is_folder,
            children: files,
            is_replaced: Some(false),
        })
    } else {
        Ok(MoveFileInfo {
            old_path: old_path.to_str().unwrap_or("").to_string(),
            new_path: new_path.to_str().unwrap_or("").to_string(),
            is_folder: is_folder,
            children: None,
            is_replaced: Some(false),
        })
    }
}

pub fn move_files_to_target_folder(
    files: Vec<String>,
    target_folder: &str,
    replace_exist: bool,
) -> AnyResult<Vec<MoveFileInfo>> {
    let mut path_map_old_to_new = vec![];

    for file in files {
        let file_path = Path::new(&file);
        let file_name = match file_path.file_name() {
            Some(name) => name,
            None => continue,
        };
        let target_path = Path::new(target_folder).join(file_name);

        if target_path.exists() {
            if replace_exist {
                if target_path.is_dir() {
                    fs::remove_dir_all(target_path.clone())?;
                } else {
                    fs::remove_file(target_path.clone())?;
                }

                path_map_old_to_new.push(MoveFileInfo {
                    old_path: target_path.to_str().unwrap_or("").to_string(),
                    new_path: "".to_string(),
                    is_folder: target_path.is_dir(),
                    children: None,
                    is_replaced: Some(true),
                });
            } else {
                continue;
            }
        }

        let move_file_info = rename_fs(file_path, Path::new(&target_path))?;
        path_map_old_to_new.push(move_file_info);
    }

    Ok(path_map_old_to_new)
}

pub fn is_dir(path: &str) -> bool {
    let file_path = Path::new(path);
    file_path.is_dir()
}

pub fn get_path_name(path: &str) -> String {
    let file_path = Path::new(path);
    match file_path.file_name() {
        Some(name) => name.to_str().unwrap_or("").to_string(),
        None => String::from(""),
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileNormalInfo {
    pub size: String,
    pub last_modified: String,
    pub error_msg: String,
}

impl Default for FileNormalInfo {
    fn default() -> Self {
        FileNormalInfo {
            size: "".into(),
            last_modified: "".into(),
            error_msg: "".into(),
        }
    }
}

fn format_file_size(size: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;

    if size >= GB {
        format!("{:.2} GB", size as f64 / GB as f64)
    } else if size >= MB {
        format!("{:.2} MB", size as f64 / MB as f64)
    } else if size >= KB {
        format!("{:.2} KB", size as f64 / KB as f64)
    } else {
        format!("{} bytes", size)
    }
}

pub fn get_file_normal_info(path_str: &str) -> FileNormalInfo {
    let path = Path::new(path_str);

    // 尝试获取元数据
    let metadata_result = fs::metadata(path);

    match metadata_result {
        Ok(metadata) => {
            // 获取并格式化文件大小
            let size = metadata.len();
            let formatted_size = format_file_size(size);

            // 获取并格式化修改时间
            let modified_time = match metadata.modified() {
                Ok(time) => {
                    let datetime: DateTime<Local> = DateTime::from(time);
                    format!("{}", datetime.format("%Y-%m-%d %H:%M:%S"))
                }
                Err(e) => {
                    return FileNormalInfo {
                        size: "".to_string(),
                        last_modified: "".to_string(),
                        error_msg: format!("无法获取修改时间: {}", e),
                    };
                }
            };

            FileNormalInfo {
                size: formatted_size,
                last_modified: modified_time,
                error_msg: "".to_string(),
            }
        }
        Err(e) => FileNormalInfo {
            size: "".to_string(),
            last_modified: "".to_string(),
            error_msg: format!("无法获取文件元数据: {}", e),
        },
    }
}

pub fn convert_text_async(
    text: String,
    variant: String,
) -> impl Future<Output = Result<String, SystemError>> {
    use crate::task_system::{
        error::SystemError,
        system::System,
        task::{ExecStatus, Interrupter, Task, TaskId, TaskOutput},
    };
    use async_trait::async_trait;
    use thiserror::Error;
    use zhconv::{zhconv, Variant};

    #[derive(Debug, Error)]
    enum ConvertError {
        #[error("System error: {0}")]
        SystemError(#[from] SystemError),
    }

    #[derive(Debug)]
    struct ConvertTextTask {
        id: TaskId,
        text: String,
        variant: String,
    }

    impl ConvertTextTask {
        fn new(text: String, variant: String) -> Self {
            Self {
                id: TaskId::new_v4(),
                text,
                variant,
            }
        }
    }

    #[async_trait]
    impl Task<ConvertError> for ConvertTextTask {
        fn id(&self) -> TaskId {
            self.id
        }

        fn with_priority(&self) -> bool {
            true
        }

        async fn run(&mut self, _interrupter: &Interrupter) -> Result<ExecStatus, ConvertError> {
            let variant_enum = match self.variant.as_str() {
                "zh-TW" => Variant::ZhTW,
                "zh-HK" => Variant::ZhHK,
                "zh-CN" => Variant::ZhCN,
                "zh-Hans" => Variant::ZhHans,
                _ => Variant::ZhTW,
            };
            let result = zhconv(&self.text, variant_enum);
            Ok(ExecStatus::Done(TaskOutput::Out(Box::new(result))))
        }
    }

    async move {
        let system = System::<ConvertError>::new();
        let task = ConvertTextTask::new(text, variant);
        let handle = system
            .dispatch(task)
            .await
            .map_err(|_| SystemError::TaskAborted(TaskId::nil()))?;

        match handle.await {
            Ok(crate::task_system::task::TaskStatus::Done((_, TaskOutput::Out(out)))) => {
                let text = out
                    .downcast::<String>()
                    .map_err(|_| SystemError::TaskAborted(TaskId::nil()))?;
                Ok(*text)
            }
            Ok(crate::task_system::task::TaskStatus::Error(ConvertError::SystemError(e))) => Err(e),
            _ => Err(SystemError::TaskAborted(TaskId::nil())),
        }
    }
}

pub mod cmd {
    use crate::fc::{self, FileNormalInfo, FileResultCode};
    use base64::engine::Engine;
    use base64::prelude::BASE64_STANDARD;
    use regex::Regex;
    use std::fs;
    use std::path::Path;
    use trash;

    use super::{FileResult, MoveFileInfo};

    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    #[tauri::command]
    pub fn open_folder(folder_path: &str) -> FileResult {
        let dir_data = fc::read_directory(folder_path);
        match dir_data {
            Ok(files) => {
                let json_data = fc::files_to_json(files);
                let content = match json_data.code {
                    fc::FileResultCode::Success => json_data.content,
                    _ => String::from(""),
                };

                if content == "" {
                    return FileResult {
                        code: fc::FileResultCode::NotFound,
                        content: String::from("Folder not found"),
                    };
                }

                FileResult {
                    code: fc::FileResultCode::Success,
                    content: content,
                }
            }
            Err(_) => FileResult {
                code: fc::FileResultCode::UnknownError,
                content: String::from("Failed to read directory"),
            },
        }
    }

    #[tauri::command]
    pub async fn open_folder_async(folder_path: String) -> FileResult {
        match fc::read_directory_async(folder_path).await {
            Ok(files) => {
                let json_data = fc::files_to_json(files);
                let content = match json_data.code {
                    fc::FileResultCode::Success => json_data.content,
                    _ => String::from(""),
                };

                if content == "" {
                    return FileResult {
                        code: fc::FileResultCode::NotFound,
                        content: String::from("Folder not found"),
                    };
                }

                FileResult {
                    code: fc::FileResultCode::Success,
                    content: content,
                }
            }
            Err(_) => FileResult {
                code: fc::FileResultCode::UnknownError,
                content: String::from("Failed to read directory"),
            },
        }
    }

    #[tauri::command]
    pub fn get_file_content(file_path: &str) -> FileResult {
        fc::read_file(file_path)
    }

    #[tauri::command]
    pub fn write_file(file_path: &str, content: &str) -> FileResult {
        fc::write_file(file_path, content)
    }

    #[tauri::command]
    pub fn read_u8_array_from_file(file_path: &str) -> FileResult {
        match fs::read(file_path) {
            Ok(content) => FileResult {
                code: FileResultCode::Success,
                content: BASE64_STANDARD.encode(content),
            },
            Err(e) => {
                let code = match e.kind() {
                    std::io::ErrorKind::NotFound => FileResultCode::NotFound,
                    std::io::ErrorKind::PermissionDenied => FileResultCode::PermissionDenied,
                    _ => FileResultCode::UnknownError,
                };
                FileResult {
                    code,
                    content: format!("Failed to read file: {}", e),
                }
            }
        }
    }

    #[tauri::command]
    pub fn write_u8_array_to_file(file_path: &str, content: Vec<u8>) -> FileResult {
        let file_path = Path::new(file_path);

        // Create parent directories if they don't exist
        if let Some(parent) = file_path.parent() {
            if !parent.exists() {
                if let Err(e) = fs::create_dir_all(parent) {
                    let code = match e.kind() {
                        std::io::ErrorKind::PermissionDenied => FileResultCode::PermissionDenied,
                        _ => FileResultCode::UnknownError,
                    };
                    return FileResult {
                        code,
                        content: format!("Failed to create parent directories: {}", e),
                    };
                }
            }
        }

        // Write the file content
        match fs::write(file_path, content) {
            Ok(()) => FileResult {
                code: FileResultCode::Success,
                content: String::from("File written successfully"),
            },
            Err(e) => {
                let code = match e.kind() {
                    std::io::ErrorKind::NotFound => FileResultCode::NotFound,
                    std::io::ErrorKind::PermissionDenied => FileResultCode::PermissionDenied,
                    _ => FileResultCode::UnknownError,
                };
                FileResult {
                    code,
                    content: format!("Failed to write file: {}", e),
                }
            }
        }
    }

    #[tauri::command]
    pub fn delete_file(file_path: &str) -> String {
        fc::remove_file(file_path);
        String::from("OK")
    }

    #[tauri::command]
    pub fn create_folder(path: &str) -> FileResult {
        fc::create_folder(path)
    }

    #[tauri::command]
    pub fn delete_folder(file_path: &str) -> FileResult {
        fc::remove_folder(file_path)
    }

    #[tauri::command]
    pub fn file_exists(file_path: &str) -> bool {
        fc::exists(Path::new(file_path))
    }

    #[tauri::command]
    pub fn move_files_to_target_folder(
        files: Vec<String>,
        target_folder: &str,
        replace_exist: bool,
    ) -> Option<Vec<MoveFileInfo>> {
        let res = fc::move_files_to_target_folder(files, target_folder, replace_exist);

        match res {
            Ok(path_map_old_to_new) => Some(path_map_old_to_new),
            Err(_) => None,
        }
    }

    #[tauri::command]
    pub fn path_join(path1: &str, path2: &str) -> String {
        let path = Path::new(path1).join(path2);
        path.to_str().unwrap_or("").to_string()
    }

    #[tauri::command]
    pub fn rename_fs(old_path: &str, new_path: &str) -> Option<MoveFileInfo> {
        let path = Path::new(old_path);
        let new_path = Path::new(new_path);
        fc::rename_fs(path, new_path).ok()
    }

    #[tauri::command]
    pub fn get_md_relative_path(file_path: &str, relative_to: &str) -> FileResult {
        use std::path::Component;

        let cur_path = Path::new(file_path);
        let relative_to_path = Path::new(relative_to);

        if !cur_path.is_absolute() {
            return FileResult {
                code: FileResultCode::InvalidPath,
                content: "File path must be absolute".to_string(),
            };
        }

        if !relative_to_path.is_absolute() {
            return FileResult {
                code: FileResultCode::InvalidPath,
                content: "Relative path must be absolute".to_string(),
            };
        }

        let cur_components: Vec<Component> = cur_path.components().collect();
        let relative_to_components: Vec<Component> = relative_to_path.components().collect();

        let common_prefix_len = cur_components
            .iter()
            .zip(relative_to_components.iter())
            .take_while(|(a, b)| a == b)
            .count();

        let mut components = vec![];
        for _ in common_prefix_len..relative_to_components.len() {
            components.push("..");
        }

        for component in &cur_components[common_prefix_len..] {
            if let Component::Normal(name) = component {
                if let Some(name_str) = name.to_str() {
                    components.push(name_str);
                } else {
                    return FileResult {
                        code: FileResultCode::InvalidPath,
                        content: "Failed to convert path to string (invalid UTF-8)".to_string(),
                    };
                }
            } else if let Component::CurDir | Component::ParentDir = component {
                match component {
                    Component::Normal(name) => {
                        if let Some(name_str) = name.to_str() {
                            components.push(name_str);
                        } else {
                            return FileResult {
                                code: FileResultCode::InvalidPath,
                                content: "Failed to convert path to string (invalid UTF-8)"
                                    .to_string(),
                            };
                        }
                    }
                    Component::CurDir => {
                        components.push(".");
                    }
                    Component::ParentDir => {
                        components.push("..");
                    }
                    Component::Prefix(_) => {
                        // Windows驱动器前缀，忽略
                        continue;
                    }
                    Component::RootDir => {
                        // Unix根目录，忽略
                        continue;
                    }
                }
            }
        }

        let relative_path = if components.is_empty() {
            ".".to_string()
        } else {
            components.join("/")
        };

        // 确保返回的是Markdown语法的路径（使用正斜杠）
        let md_relative_path = relative_path.replace("\\", "/");

        FileResult {
            code: FileResultCode::Success,
            content: md_relative_path,
        }
    }

    #[tauri::command]
    pub fn copy_file_by_from(from: &str) -> Option<String> {
        let from_path = Path::new(from);
        let parent_path = from_path.parent()?;
        let mut to_path_name = from_path.file_stem()?.to_str()?.to_string();

        let file_ext = from_path.extension()?;

        while parent_path
            .join(&format!(
                "{}.{}",
                to_path_name.clone(),
                file_ext.to_str().unwrap_or("")
            ))
            .exists()
        {
            to_path_name.push_str(" copy");
        }

        to_path_name.push_str(format!(".{}", file_ext.to_str().unwrap_or("")).as_str());

        let to_path = parent_path.join(&to_path_name);
        fs::copy(from_path, to_path.clone()).ok()?;

        Some(to_path.to_str()?.to_string())
    }

    #[tauri::command]
    pub fn trash_delete(path: &str) -> bool {
        trash::delete(path).is_ok()
    }

    #[tauri::command]
    pub fn export_html_to_path(str: &str, path: &str) -> String {
        let re = Regex::new(r#"\\\""#).unwrap();

        let result = re.replace_all(str, "\"");

        let file_path = Path::new(path);

        match fs::write(file_path, result.to_string()) {
            Ok(_) => String::from("OK"),
            Err(e) => format!("ERROR: {}", e),
        }
    }

    #[tauri::command]
    pub async fn export_pdf_to_path(app: tauri::AppHandle, html: String, path: String) -> String {
        #[cfg(target_os = "macos")]
        {
            export_pdf_to_path_macos(app, html, path).await
        }

        #[cfg(target_os = "windows")]
        {
            export_pdf_to_path_windows(app, html, path).await
        }

        #[cfg(not(any(target_os = "macos", target_os = "windows")))]
        {
            let _ = app;
            let _ = html;
            let _ = path;
            "ERROR: selectable PDF export is only implemented on macOS and Windows".to_string()
        }
    }

    #[cfg(target_os = "macos")]
    async fn export_pdf_to_path_macos(
        _app: tauri::AppHandle,
        html: String,
        path: String,
    ) -> String {
        use std::path::{Path, PathBuf};
        use std::process::Stdio;
        use tokio::process::Command;
        use uuid::Uuid;

        fn find_chrome_path() -> Option<PathBuf> {
            if let Ok(path) = std::env::var("MARKFLOWY_CHROME_PATH") {
                let path = PathBuf::from(path);
                if path.exists() {
                    return Some(path);
                }
            }

            [
                "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
                "/Applications/Chromium.app/Contents/MacOS/Chromium",
                "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
                "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
            ]
            .iter()
            .map(PathBuf::from)
            .find(|path| path.exists())
        }

        let chrome_path = match find_chrome_path() {
            Some(path) => path,
            None => {
                return "ERROR: Chrome was not found. Install Google Chrome or set MARKFLOWY_CHROME_PATH.".to_string();
            }
        };

        let temp_path =
            std::env::temp_dir().join(format!("markflowy-export-{}.html", Uuid::new_v4()));
        if let Err(err) = fs::write(&temp_path, html) {
            return format!("ERROR: failed to create temporary HTML: {}", err);
        }

        let user_data_dir =
            std::env::temp_dir().join(format!("markflowy-chrome-profile-{}", Uuid::new_v4()));
        if let Err(err) = fs::create_dir_all(&user_data_dir) {
            let _ = fs::remove_file(&temp_path);
            return format!("ERROR: failed to create temporary Chrome profile: {}", err);
        }

        let file_url = match url::Url::from_file_path(&temp_path) {
            Ok(url) => url,
            Err(_) => {
                let _ = fs::remove_file(&temp_path);
                let _ = fs::remove_dir_all(&user_data_dir);
                return "ERROR: failed to create temporary HTML URL".to_string();
            }
        };

        let mut command = Command::new(chrome_path);
        command
            .arg("--headless")
            .arg("--disable-gpu")
            .arg("--disable-extensions")
            .arg("--disable-background-networking")
            .arg("--run-all-compositor-stages-before-draw")
            .arg("--allow-file-access-from-files")
            .arg("--no-pdf-header-footer")
            .arg("--print-to-pdf-no-header")
            .arg("--no-margins")
            .arg("--timeout=120000")
            .arg(format!("--user-data-dir={}", user_data_dir.display()))
            .arg(format!("--print-to-pdf={}", path))
            .arg(file_url.as_str())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());
        command.kill_on_drop(true);

        let mut child = match command.spawn() {
            Ok(child) => child,
            Err(err) => {
                let _ = fs::remove_file(&temp_path);
                let _ = fs::remove_dir_all(&user_data_dir);
                return format!("ERROR: failed to start Chrome PDF export: {}", err);
            }
        };

        let started_at = std::time::Instant::now();
        let timeout = std::time::Duration::from_secs(130);
        let mut last_pdf_size = 0;
        let mut stable_pdf_size_checks = 0;

        let result = loop {
            let pdf_size = Path::new(&path)
                .metadata()
                .map(|metadata| metadata.len())
                .unwrap_or(0);
            if pdf_size > 0 {
                if pdf_size == last_pdf_size {
                    stable_pdf_size_checks += 1;
                } else {
                    stable_pdf_size_checks = 0;
                    last_pdf_size = pdf_size;
                }

                if stable_pdf_size_checks >= 2 {
                    let _ = child.kill().await;
                    let _ = child.wait().await;
                    break "OK".to_string();
                }
            }

            match child.try_wait() {
                Ok(Some(_status)) => {
                    let output = match child.wait_with_output().await {
                        Ok(output) => output,
                        Err(err) => {
                            break format!(
                                "ERROR: failed to read Chrome PDF export result: {}",
                                err
                            );
                        }
                    };

                    if output.status.success()
                        && Path::new(&path)
                            .metadata()
                            .map(|metadata| metadata.len() > 0)
                            .unwrap_or(false)
                    {
                        break "OK".to_string();
                    }

                    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
                    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
                    let detail = if !stderr.is_empty() { stderr } else { stdout };
                    if detail.is_empty() {
                        break format!(
                            "ERROR: Chrome PDF export failed with status {}",
                            output.status
                        );
                    } else {
                        break format!("ERROR: Chrome PDF export failed: {}", detail);
                    }
                }
                Ok(None) => {}
                Err(err) => break format!("ERROR: failed to monitor Chrome PDF export: {}", err),
            }

            if started_at.elapsed() >= timeout {
                let _ = child.kill().await;
                let _ = child.wait().await;
                let _ = fs::remove_file(&path);
                break "ERROR: Chrome PDF export timed out".to_string();
            }

            tokio::time::sleep(std::time::Duration::from_millis(250)).await;
        };

        let _ = fs::remove_file(&temp_path);
        let _ = fs::remove_dir_all(&user_data_dir);

        result
    }

    #[cfg(target_os = "windows")]
    async fn export_pdf_to_path_windows(
        app: tauri::AppHandle,
        html: String,
        path: String,
    ) -> String {
        use tauri::{
            utils::config::WebviewUrl, webview::PageLoadEvent, Manager, WebviewWindowBuilder,
        };
        use tokio::sync::oneshot;
        use uuid::Uuid;

        let temp_path =
            std::env::temp_dir().join(format!("markflowy-export-{}.html", Uuid::new_v4()));
        if let Err(err) = fs::write(&temp_path, html) {
            return format!("ERROR: failed to create temporary HTML: {}", err);
        }

        let file_url = match url::Url::from_file_path(&temp_path) {
            Ok(url) => url,
            Err(_) => {
                let _ = fs::remove_file(&temp_path);
                return "ERROR: failed to create temporary HTML URL".to_string();
            }
        };

        let label = format!("pdf-export-{}", Uuid::new_v4());
        let (tx, rx) = oneshot::channel::<String>();
        let tx = std::sync::Arc::new(std::sync::Mutex::new(Some(tx)));
        let output_path = path.clone();

        let window_result =
            WebviewWindowBuilder::new(&app, label.clone(), WebviewUrl::External(file_url))
                .title("PDF Export")
                .visible(false)
                .decorations(false)
                .resizable(false)
                .inner_size(794.0, 1123.0)
                .on_page_load(move |window, payload| {
                    if matches!(payload.event(), PageLoadEvent::Finished) {
                        let window = window.clone();
                        let output_path = output_path.clone();
                        let tx = tx.clone();

                        tauri::async_runtime::spawn(async move {
                            tokio::time::sleep(std::time::Duration::from_millis(250)).await;
                            export_loaded_webview_to_pdf_windows(window, output_path, tx);
                        });
                    }
                })
                .build();

        let window = match window_result {
            Ok(window) => window,
            Err(err) => {
                let _ = fs::remove_file(&temp_path);
                return format!("ERROR: failed to create PDF export window: {}", err);
            }
        };

        let result = match tokio::time::timeout(std::time::Duration::from_secs(15), rx).await {
            Ok(Ok(message)) => message,
            Ok(Err(_)) => "ERROR: PDF export was cancelled".to_string(),
            Err(_) => "ERROR: PDF export timed out".to_string(),
        };

        let _ = window.close();
        if let Some(export_window) = app.get_webview_window(&label) {
            let _ = export_window.close();
        }
        let _ = fs::remove_file(&temp_path);

        result
    }

    #[cfg(target_os = "windows")]
    fn export_loaded_webview_to_pdf_windows(
        window: tauri::WebviewWindow,
        path: String,
        tx: std::sync::Arc<std::sync::Mutex<Option<tokio::sync::oneshot::Sender<String>>>>,
    ) {
        let tx_for_error = tx.clone();
        if let Err(err) = window.with_webview(move |platform_webview| {
            use webview2_com::Microsoft::Web::WebView2::Win32::{
                ICoreWebView2Environment6, ICoreWebView2_7, COREWEBVIEW2_PRINT_ORIENTATION_PORTRAIT,
            };
            use webview2_com::PrintToPdfCompletedHandler;
            use windows_core::{Interface, PCWSTR};

            let result = (|| -> windows_core::Result<()> {
                unsafe {
                    let webview = platform_webview.controller().CoreWebView2()?;
                    let environment = platform_webview
                        .environment()
                        .cast::<ICoreWebView2Environment6>()?;
                    let print_settings = environment.CreatePrintSettings()?;
                    print_settings.SetOrientation(COREWEBVIEW2_PRINT_ORIENTATION_PORTRAIT)?;
                    print_settings.SetPageWidth(8.27)?;
                    print_settings.SetPageHeight(11.69)?;
                    print_settings.SetMarginTop(0.0)?;
                    print_settings.SetMarginBottom(0.0)?;
                    print_settings.SetMarginLeft(0.0)?;
                    print_settings.SetMarginRight(0.0)?;
                    print_settings.SetScaleFactor(1.0)?;
                    print_settings.SetShouldPrintBackgrounds(true)?;
                    print_settings.SetShouldPrintHeaderAndFooter(false)?;
                    let webview = webview.cast::<ICoreWebView2_7>()?;
                    let pdf_path: Vec<u16> =
                        path.encode_utf16().chain(std::iter::once(0)).collect();
                    let tx = tx.clone();
                    let handler = PrintToPdfCompletedHandler::create(Box::new(
                        move |error_code: windows_core::Result<()>, success: bool| {
                            let message = if error_code.is_err() {
                                format!("ERROR: WebView2 failed to create PDF: {:?}", error_code)
                            } else if !success {
                                "ERROR: WebView2 returned unsuccessful PDF export".to_string()
                            } else {
                                "OK".to_string()
                            };

                            if let Ok(mut sender) = tx.lock() {
                                if let Some(sender) = sender.take() {
                                    let _ = sender.send(message);
                                }
                            }

                            Ok(())
                        },
                    ));

                    webview.PrintToPdf(
                        PCWSTR::from_raw(pdf_path.as_ptr()),
                        &print_settings,
                        &handler,
                    )?;
                    Ok(())
                }
            })();

            if let Err(err) = result {
                if let Ok(mut sender) = tx.lock() {
                    if let Some(sender) = sender.take() {
                        let _ = sender.send(format!("ERROR: failed to export PDF: {}", err));
                    }
                }
            }
        }) {
            if let Ok(mut sender) = tx_for_error.lock() {
                if let Some(sender) = sender.take() {
                    let _ = sender.send(format!("ERROR: failed to access WebView2: {}", err));
                }
            }
        }
    }

    #[tauri::command]
    pub fn is_dir(path: &str) -> bool {
        fc::is_dir(path)
    }

    #[tauri::command]
    pub fn get_path_name(path: &str) -> String {
        fc::get_path_name(path)
    }

    #[tauri::command]
    pub fn get_file_normal_info(path: &str) -> FileNormalInfo {
        fc::get_file_normal_info(path)
    }

    #[tauri::command]
    pub fn copy_file(from: &str, to: &str) -> FileResult {
        let old_path = Path::new(from);
        let new_path = Path::new(to);

        // Validate input paths
        if from.is_empty() || to.is_empty() {
            return FileResult {
                code: FileResultCode::InvalidPath,
                content: String::from("Source or destination path cannot be empty"),
            };
        }

        // Check if source file exists
        if !old_path.exists() {
            return FileResult {
                code: FileResultCode::NotFound,
                content: format!("Source file not found: {}", from),
            };
        }

        // Create parent directories for destination if they don't exist
        if let Some(parent) = new_path.parent() {
            if !parent.exists() {
                if let Err(e) = fs::create_dir_all(parent) {
                    let code = match e.kind() {
                        std::io::ErrorKind::PermissionDenied => FileResultCode::PermissionDenied,
                        _ => FileResultCode::UnknownError,
                    };
                    return FileResult {
                        code,
                        content: format!(
                            "Failed to create parent directories for destination: {}",
                            e
                        ),
                    };
                }
            }
        }

        // Perform the copy operation
        match fs::copy(old_path, new_path) {
            Ok(bytes_copied) => FileResult {
                code: FileResultCode::Success,
                content: format!("File copied successfully ({} bytes)", bytes_copied),
            },
            Err(e) => {
                let code = match e.kind() {
                    std::io::ErrorKind::NotFound => FileResultCode::NotFound,
                    std::io::ErrorKind::PermissionDenied => FileResultCode::PermissionDenied,
                    std::io::ErrorKind::AlreadyExists => FileResultCode::InvalidPath,
                    _ => FileResultCode::UnknownError,
                };
                FileResult {
                    code,
                    content: format!("Failed to copy file from '{}' to '{}': {}", from, to, e),
                }
            }
        }
    }

    #[tauri::command]
    pub async fn convert_text(text: String, variant: String) -> FileResult {
        match fc::convert_text_async(text, variant).await {
            Ok(content) => FileResult {
                code: FileResultCode::Success,
                content,
            },
            Err(e) => FileResult {
                code: FileResultCode::UnknownError,
                content: e.to_string(),
            },
        }
    }
}

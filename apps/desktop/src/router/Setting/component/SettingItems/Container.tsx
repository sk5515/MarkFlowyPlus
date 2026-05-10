import styled from "styled-components"

interface SettingItemContainerProps {
  $direction?: 'row' | 'column'
}

export const SettingItemContainer = styled.div<SettingItemContainerProps>`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;

  ${(props) => props.$direction === 'column' && `
    flex-direction: column;
  `}

  .setting-item__slider {
    width: 120px;
    height: 28px;
    margin: 0;
    padding: 12px 0;
    box-sizing: border-box;
    align-self: center;

    .ant-slider-rail,
    .ant-slider-track,
    .ant-slider-tracks {
      top: 50% !important;
      inset-block-start: 50% !important;
      transform: translateY(-50%);
    }

    .ant-slider-handle {
      top: 50% !important;
      inset-block-start: 50% !important;
      margin-top: 0 !important;
      transform: translateY(-50%) !important;
    }
  }
`

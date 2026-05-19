import FontListSelectSettingItem from './FontListSelect'
import InputSettingItem from './Input'
import PathSelectSettingItem from './PathSelect'
import SelectSettingItem from './Select'
import SliderSettingItem from './Slider'
import StringMapJsonSettingItem from './StringMapJson'
import SwitchSettingItem from './Switch'
import {
  isFontListSelectSettingItem,
  isInputSettingItem,
  isPathSelectSettingItem,
  isSelectSettingItem,
  isSliderSettingItem,
  isStringMapJsonSettingItem,
  isSwitchSettingItem,
} from './types'

const SettingItem: React.FC<SettingItemProps> = (props) => {
  const { item, ...otherProps } = props
  if (isSelectSettingItem(item))
    return <SelectSettingItem key={item.key} item={item} {...otherProps} />

  if (isInputSettingItem(item))
    return <InputSettingItem key={item.key} item={item} {...otherProps} />

  if (isSwitchSettingItem(item))
    return <SwitchSettingItem key={item.key} item={item} {...otherProps} />

  if (isSliderSettingItem(item))
    return <SliderSettingItem key={item.key} item={item} {...otherProps} />

  if (isFontListSelectSettingItem(item))
    return <FontListSelectSettingItem key={item.key} item={item} {...otherProps} />

  if (isStringMapJsonSettingItem(item))
    return <StringMapJsonSettingItem key={item.key} item={item} {...otherProps} />

  if (isPathSelectSettingItem(item))
    return <PathSelectSettingItem key={item.key} item={item} {...otherProps} />

  return <></>
}

export interface SettingItemProps<T = Setting.SettingItem> {
  item: T
}

export default SettingItem

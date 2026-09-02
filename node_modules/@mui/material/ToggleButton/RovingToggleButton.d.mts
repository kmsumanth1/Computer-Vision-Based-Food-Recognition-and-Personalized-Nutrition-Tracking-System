import * as React from 'react';
interface RovingToggleButtonChildProps {
  ref?: React.Ref<HTMLElement> | undefined;
  tabIndex?: number | undefined;
}
interface RovingToggleButtonProps {
  children: React.ReactElement<RovingToggleButtonChildProps>;
  disabled?: boolean | undefined;
  selected?: boolean | undefined;
  value: unknown;
}
declare const _default: React.ForwardRefExoticComponent<RovingToggleButtonProps & React.RefAttributes<HTMLElement>>;
export default _default;
"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _useRovingTabIndex = require("../utils/useRovingTabIndex");
function RovingToggleButton(props, ref) {
  const {
    children,
    disabled = false,
    selected = false,
    value
  } = props;
  const rovingContext = (0, _useRovingTabIndex.useRovingTabIndexContext)();
  const rovingItemProps = (0, _useRovingTabIndex.useRovingTabIndexItem)({
    id: value,
    ref,
    disabled,
    selected
  });

  // On the server, and on the first client render before registration effects run,
  // the roving item map is still empty. In that window, fall back to `tabIndex={0}`
  // for the selected toggle button so the rendered markup is immediately keyboard-accessible
  // and hydration stays consistent until item registration takes over.
  const shouldUseSelectedTabStopFallback = rovingContext.getItemMap().size === 0 && selected;
  const tabIndex = shouldUseSelectedTabStopFallback ? 0 : rovingItemProps.tabIndex;
  return /*#__PURE__*/React.cloneElement(React.Children.only(children), {
    ...rovingItemProps,
    tabIndex: children.props.tabIndex ?? tabIndex
  });
}
var _default = exports.default = /*#__PURE__*/React.forwardRef(RovingToggleButton);
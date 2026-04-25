# Mobile Toolkit

适用于需要通过手机桥接执行 Android 自动化的场景。

执行顺序：
1. 先调用 `mobile_list_devices` 确认设备在线。
2. 再调用 `mobile_read_state` 观察当前页面。
3. 点击、输入、截图时优先使用 `mobile_find_element` + `mobile_click_element` / `mobile_input_text`。
4. 如果需要切应用，先用 `mobile_open_app`。

约束：
1. 默认不要盲点坐标，优先走 selector。
2. 连续操作之间需要结合最新 state 判断是否成功。
3. 如果没有可用设备，先检查 bridge 服务和手机反向连接状态。

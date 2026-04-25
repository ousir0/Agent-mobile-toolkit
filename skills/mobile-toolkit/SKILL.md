# Mobile Toolkit

适用于需要通过手机桥接执行 Android 自动化的场景。

执行顺序：
1. 先调用 `mobile_list_devices` 确认设备在线。
2. 再调用 `mobile_read_state` 观察当前页面。
3. 点击、输入、截图时优先使用 `mobile_find_element` + `mobile_click_element` / `mobile_input_text`。
4. 如果需要切应用，先用 `mobile_open_app`。
5. 如果目标 App 的无障碍树抓不全，改用 `mobile_capture_screen` 判断界面，再退回 `mobile_tap_screen` / `mobile_swipe_screen` 走坐标操作。
6. 如果需要先把图片、素材或临时文件送进手机，再用 `mobile_upload_file`。

约束：
1. 默认不要盲点坐标，优先走 selector。
2. 连续操作之间需要结合最新 state 判断是否成功。
3. 如果没有可用设备，先检查 bridge 服务和手机反向连接状态。
4. `mobile_upload_file` 需要传 base64 内容，建议把文件落到 `/sdcard/Pictures/...`、`/sdcard/Download/...` 这类系统可见目录。

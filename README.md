# Mofei Remote Card

用于 Home Assistant Lovelace 的自定义遥控器卡片，适配墨菲中控场景、影音、设施和 KTV 页面。

## 功能

- 内置分页切换，不依赖额外 `input_select`
- 支持场景页长按重命名
- 支持影音页、设施页、KTV 页定制布局
- 可配合 `mofei_mqtt_bridge` 集成直接发送控制命令

## 安装

1. 将本仓库作为 HACS 自定义仓库添加
2. 类型选择 `Dashboard`
3. 安装 `Mofei Remote Card`
4. 刷新浏览器

## 使用

在 Lovelace 原始配置中添加：

```yaml
type: custom:mofei-remote-card
title: 智能中控
```

## 依赖

建议搭配 `mofei_mqtt_bridge` 集成使用，这样卡片按钮可以直接映射到 MQTT 控制命令。

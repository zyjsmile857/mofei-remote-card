class MofeiRemoteCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("mofei-remote-card-editor");
  }

  static getStubConfig() {
    return {
      title: "\u667a\u80fd\u4e2d\u63a7"
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._page = "scene";
    this._renamePressTimer = null;
    this._suppressNextClick = false;
    this._renameDialog = null;
    this._sceneLabels = {};
    this._sceneLabelsLoadedMac = null;
    this._acTemperature = 22;
    this._acTempDragging = false;
    this._acPowerOn = true;
    this._lightChannelStates = {};
    this._logoUrl = this._resolveLogoUrl();
    this._boundAcTempPointerMove = this._handleAcTempPointerMove.bind(this);
    this._boundAcTempPointerUp = this._handleAcTempPointerUp.bind(this);
    this._titleMap = {
      scene: "\u667a\u80fd\u4e2d\u63a7",
      media: "\u5f71\u97f3\u63a7\u5236",
      home: "\u8bbe\u65bd\u63a7\u5236",
      ktv: "KTV \u5a31\u4e50"
    };
    this._pages = this._buildPages();
  }

  setConfig(config) {
    this._config = {
      title: "\u667a\u80fd\u4e2d\u63a7",
      service: "mofei_mqtt_bridge.send_message",
      ...(config || {})
    };
    this._logoUrl = this._resolveLogoUrl();

    if (this._sceneLabelsLoadedMac !== this._config.mac) {
      this._sceneLabels = {};
      this._sceneLabelsLoadedMac = null;
    }

    this._acTemperature = this._getStoredAcTemperature();
    this._acPowerOn = this._getStoredAcPowerState();
    this._lightChannelStates = this._getStoredLightChannelStates();

    this._render();
    this._ensureSceneLabelsLoaded();
  }

  set hass(hass) {
    this._hass = hass;
    this._updateDynamicState();
    this._ensureSceneLabelsLoaded();
  }

  getCardSize() {
    return 10;
  }

  _buildPages() {
    const pages = {
      scene: [
        {
          title: "\u4e3b\u573a\u666f",
          grid: "grid-2",
          buttons: [
            ["\u5f71\u9662\u6a21\u5f0f", "FE04D000"],
            ["KTV \u6a21\u5f0f", "FE04D001"],
            ["\u6e38\u620f\u6a21\u5f0f", "FE04D002"],
            ["\u7535\u89c6\u6a21\u5f0f", "FE04D003"],
            ["\u4f1a\u5ba2\u6a21\u5f0f", "FE04D004"],
            ["\u79bb\u5f00\u6a21\u5f0f", "FE04D00D"]
          ]
        },
        {
          title: "K\u6b4c\u6c1b\u56f4",
          grid: "grid-4",
          buttons: [
            ["\u52a8\u611f", "FE04D0A0"],
            ["\u67d4\u548c", "FE04D0A1"],
            ["\u660e\u4eae", "FE04D0A2"],
            ["\u6292\u60c5", "FE04D0A3"]
          ]
        }
      ],
      media: [
        {
          title: "\u5a92\u4f53\u63a7\u5236",
          topButtons: [
            ["\u529f\u653e\u5f00", "FE05C00101", "danger"],
            ["\u529f\u653e\u5173", "FE05C00100", "danger"]
          ],
          dpad: {
            up: ["\u4e0a", "FE04C70A"],
            down: ["\u4e0b", "FE04C70B"],
            left: ["\u5de6", "FE04C70C"],
            right: ["\u53f3", "FE04C70D"],
            ok: ["OK", "FE04C70E"]
          },
          bottomButtons: []
        },
        {
          title: "\u64ad\u653e\u4e0e\u6295\u5f71",
          mediaPanel: {
            nav: [
              ["\u83dc\u5355", "FE04C705"],
              ["\u4e3b\u9875", "FE04C707"],
              ["\u8fd4\u56de", "FE04C70F"]
            ],
            transport: [
              ["&lsaquo;&lsaquo;", "FE04C713"],
              ["&rsaquo;&rsaquo;", "FE04C712"]
            ],
            playStack: [
              ["&#9654;", "FE04C724"],
              ["&#10074;&#10074;", "FE04C725"]
            ],
            options: [
              ["\u5b57\u5e55", "FE04C715"],
              ["\u97f3\u8f68", "FE04C714"],
              ["\u9759\u97f3", "FE04C704"]
            ],
            hidden: [
              ["\u6295\u5f71\u5f00", "FE05C10101"],
              ["\u6295\u5f71\u5173", "FE05C10100"],
              ["HDMI 1", "FE05C20101"],
              ["HDMI 2", "FE05C20102"],
              ["HDMI 3", "FE05C20103"],
              ["HDMI 4", "FE05C20104"],
              ["3D\u6a21\u5f0f", "FE04C717"]
            ]
          }
        }
      ],
      home: [
        {
          title: "\u7a7a\u8c03\u63a7\u5236",
          acPanel: {
            power: [["\u5f00/\u5173", "FE07C001160001", "danger"]],
            modes: [
              ["\u5236\u70ed", "FE07C001160002"],
              ["\u5236\u51b7", "FE07C001160102"],
              ["\u9001\u98ce", "FE07C001160202"]
            ],
            temp: [
              ["18\u00b0", "FE07C001120004"],
              ["22\u00b0", "FE07C001160004"],
              ["26\u00b0", "FE07C0011A0004"],
              ["30\u00b0", "FE07C0011E0004"]
            ],
            fan: [
              ["\u4f4e\u98ce", "FE07C001160003"],
              ["\u4e2d\u98ce", "FE07C002160003"],
              ["\u9ad8\u98ce", "FE07C003160003"],
              ["\u81ea\u52a8", "FE07C004160003"]
            ]
          }
        },
        {
          title: "\u706f\u5149\u901a\u9053 (9-14)",
          grid: "grid-3",
          buttons: [
            ["9", "FE05D10801", "", "", { toggleLight: 9 }],
            ["10", "FE05D10901", "", "", { toggleLight: 10 }],
            ["11", "FE05D10A01", "", "", { toggleLight: 11 }],
            ["12", "FE05D10B01", "", "", { toggleLight: 12 }],
            ["13", "FE05D10C01", "", "", { toggleLight: 13 }],
            ["14", "FE05D10D01", "", "", { toggleLight: 14 }]
          ]
        }
      ],
      ktv: [
        {
          title: "\u57fa\u7840\u70b9\u5531",
          grid: "grid-3",
          buttons: [
            ["\u64ad\u653e<br>\u6682\u505c", "FE04B062", "", this._getIcon("playpause")],
            ["\u9759\u97f3", "FE04B071", "", this._getIcon("mute")],
            ["\u91cd\u5531", "FE04B06C", "", this._getIcon("replay")]
          ],
          secondGrid: "grid-2",
          secondButtons: [
            ["\u539f\u4f34\u5531", "FE04B070", "", this._getIcon("mic")],
            ["\u5207\u6b4c", "FE04B069", "", this._getIcon("skip")]
          ]
        },
        {
          title: "\u97f3\u6548\u8c03\u8282",
          grid: "grid-2",
          buttons: [
            ["\u8bdd\u7b52+", "FE04B03F", "", this._getIcon("micplus")],
            ["\u97f3\u4e50+", "FE04B049", "", this._getIcon("volumeplus")],
            ["\u8bdd\u7b52-", "FE04B037", "", this._getIcon("micminus")],
            ["\u97f3\u4e50-", "FE04B041", "", this._getIcon("volumeminus")]
          ],
          secondGrid: "grid-2",
          secondButtons: [
            ["\u548c\u58f0\u6a21\u5f0f", "FE04B021", "", this._getIcon("harmony")],
            ["\u5531\u5c06\u6a21\u5f0f", "FE04B032", "", this._getIcon("singer")]
          ]
        },
        {
          title: "\u6c14\u6c1b\u9053\u5177",
          grid: "grid-4",
          buttons: [
            ["\u559d\u5f69", "FE04B054", "", this._getIcon("cheer")],
            ["\u5012\u5f69", "FE04B05B", "", this._getIcon("boo")],
            ["\u641e\u602a", "FE04B023", "", this._getIcon("funny")],
            ["\u6574\u86ca", "FE04B01C", "", this._getIcon("prank")]
          ]
        }
      ]
    };

    return {
      scene: pages.scene,
      media: pages.media,
      ktv: pages.ktv,
      home: pages.home
    };
  }

  _render() {
    if (!this._config) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --text-main: #eef3ff;
          --text-sub: #9ca8bf;
          --text-dim: #6e7a92;
          --accent: #73d7ff;
          display: block;
          color: var(--text-main);
          font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
        }

        * {
          box-sizing: border-box;
        }

        .device {
          width: 375px;
          max-width: 100%;
          height: min(812px, calc(100vh - 32px));
          margin: 0 auto 16px;
          position: relative;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 34px;
          border: 1px solid rgba(255,255,255,0.06);
          background:
            radial-gradient(circle at top, rgba(89, 186, 255, 0.16), transparent 30%),
            radial-gradient(circle at 80% 14%, rgba(123, 104, 238, 0.12), transparent 24%),
            linear-gradient(180deg, #1a2030 0%, #10151f 38%, #0a0d13 100%);
          box-shadow:
            0 28px 60px rgba(0, 0, 0, 0.48),
            inset 0 1px 0 rgba(255,255,255,0.06),
            inset 0 -1px 0 rgba(255,255,255,0.02);
        }

        .device::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(135deg, rgba(255,255,255,0.07), transparent 24%),
            radial-gradient(circle at 50% 0%, rgba(115, 215, 255, 0.1), transparent 35%);
          pointer-events: none;
        }

        .device::after {
          content: "";
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          width: 96px;
          height: 6px;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          box-shadow: 0 1px 0 rgba(255,255,255,0.06);
          pointer-events: none;
        }

        .header {
          text-align: center;
          padding: 22px 20px 10px;
          flex: 0 0 auto;
          position: relative;
          z-index: 1;
        }

        .header-kicker {
          display: none;
        }

        .header-title {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 28px;
        }

        .header-logo {
          display: block;
          width: min(168px, 62%);
          max-height: 34px;
          object-fit: contain;
          filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.22));
        }

        .content-area {
          flex: 1;
          overflow-y: auto;
          min-height: 0;
          padding: 6px 16px 114px;
          scrollbar-width: none;
          position: relative;
          z-index: 1;
        }

        .content-area::-webkit-scrollbar {
          display: none;
        }

        .page {
          display: none;
          animation: fadeIn 0.3s ease forwards;
        }

        .page.active {
          display: block;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .card {
          background: linear-gradient(180deg, rgba(24, 30, 42, 0.94), rgba(14, 18, 27, 0.94));
          border-radius: 24px;
          padding: 20px 18px 18px;
          margin-bottom: 18px;
          box-shadow:
            0 14px 28px rgba(0,0,0,0.28),
            inset 0 1px 0 rgba(255,255,255,0.06),
            inset 0 -12px 20px rgba(0,0,0,0.14);
          border: 1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .card-title {
          font-size: 12px;
          color: var(--text-sub);
          margin-bottom: 16px;
          font-weight: 700;
          letter-spacing: 1.4px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .card-title::before {
          content: "";
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), rgba(255,255,255,0.75));
          box-shadow: 0 0 14px rgba(115, 215, 255, 0.45);
        }

        .ac-card {
          padding-bottom: 16px;
        }

        .ac-power-row {
          display: flex;
          justify-content: center;
          margin-bottom: 16px;
        }

        .ac-power-btn {
          min-width: 132px;
          border-radius: 999px;
        }

        .ac-power-btn.ac-power-off {
          color: #b8c2d8;
          border-color: rgba(255,255,255,0.05);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)),
            linear-gradient(145deg, #1b212e, #121722);
          box-shadow:
            0 8px 14px rgba(0,0,0,0.22),
            inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .ac-section {
          margin-bottom: 14px;
        }

        .ac-section:last-child {
          margin-bottom: 0;
        }

        .ac-section-label {
          margin-bottom: 10px;
          font-size: 11px;
          color: var(--text-sub);
          letter-spacing: 0.9px;
          text-transform: uppercase;
        }

        .ac-grid button {
          min-height: 48px;
          border-radius: 14px;
        }

        .ac-disabled-btn {
          cursor: not-allowed;
          color: #8a93a8;
          border-color: rgba(255,255,255,0.05);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)),
            linear-gradient(145deg, #1a1f2a, #12161f);
          box-shadow:
            0 8px 14px rgba(0,0,0,0.2),
            inset 0 1px 0 rgba(255,255,255,0.04);
          text-shadow: none;
        }

        .ac-disabled-btn:hover,
        .ac-disabled-btn:active {
          transform: none !important;
          border-color: rgba(255,255,255,0.05) !important;
          color: #8a93a8 !important;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)),
            linear-gradient(145deg, #1a1f2a, #12161f) !important;
          box-shadow:
            0 8px 14px rgba(0,0,0,0.2),
            inset 0 1px 0 rgba(255,255,255,0.04) !important;
          text-shadow: none !important;
        }

        .ac-mode-btn {
          font-size: 12px;
        }

        .ac-temp-btn {
          font-size: 15px;
          font-weight: 700;
        }

        .ac-temp-dial-wrap {
          display: flex;
          justify-content: center;
          margin-top: 4px;
          margin-bottom: 6px;
        }

        .ac-temp-dial {
          position: relative;
          width: 214px;
          height: 214px;
          border-radius: 50%;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
        }

        .ac-temp-svg {
          width: 100%;
          height: 100%;
          display: block;
          filter: drop-shadow(0 12px 22px rgba(0, 0, 0, 0.22));
        }

        .ac-temp-dial.disabled {
          cursor: not-allowed;
        }

        .ac-temp-dial.disabled .ac-temp-svg {
          filter: grayscale(1) saturate(0.3) opacity(0.65);
        }

        .ac-temp-dial.disabled .ac-temp-center {
          background:
            radial-gradient(circle at top, rgba(255,255,255,0.05), transparent 48%),
            linear-gradient(180deg, rgba(32, 36, 43, 0.98), rgba(21, 24, 29, 0.98));
          border-color: rgba(255,255,255,0.05);
          box-shadow:
            0 14px 20px rgba(0,0,0,0.22),
            inset 0 1px 0 rgba(255,255,255,0.04);
        }

        .ac-temp-dial.disabled .ac-temp-value,
        .ac-temp-dial.disabled .ac-temp-degree {
          color: #8a93a8;
        }

        .ac-temp-center {
          position: absolute;
          inset: 50% auto auto 50%;
          transform: translate(-50%, -50%);
          width: 118px;
          height: 118px;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 48%),
            linear-gradient(180deg, rgba(30, 39, 56, 0.98), rgba(18, 24, 35, 0.98));
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow:
            0 18px 28px rgba(0,0,0,0.26),
            inset 0 1px 0 rgba(255,255,255,0.08);
          pointer-events: none;
        }

        .ac-temp-value {
          position: relative;
          display: inline-flex;
          align-items: flex-start;
          justify-content: center;
          min-width: 84px;
          padding-left: 6px;
          padding-right: 14px;
          font-size: 44px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: var(--text-main);
        }

        .ac-temp-degree {
          position: absolute;
          right: 0;
          top: 4px;
          font-size: 18px;
          line-height: 1;
          font-weight: 700;
          color: var(--text-sub);
        }

        .ac-temp-unit {
          margin-top: 4px;
          font-size: 12px;
          letter-spacing: 1.2px;
          color: var(--text-sub);
          text-transform: uppercase;
        }

        .ac-fan-btn {
          font-size: 12px;
        }

        .media-action-card {
          padding-bottom: 16px;
        }

        .media-action-section + .media-action-section {
          margin-top: 14px;
        }

        .media-action-grid button {
          min-height: 52px;
          border-radius: 18px;
          font-size: 13px;
        }

        .media-nav-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .media-nav-btn {
          min-height: 50px;
          border-radius: 18px;
          font-size: 13px;
        }

        .media-transport-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(112px, 128px) minmax(0, 1fr);
          gap: 12px;
          align-items: stretch;
        }

        .media-transport-btn {
          min-height: 116px;
          border-radius: 20px;
          font-size: 14px;
        }

        .media-play-stack {
          display: grid;
          grid-template-rows: repeat(2, 1fr);
          gap: 12px;
        }

        .media-play-stack button {
          min-height: 52px;
          border-radius: 18px;
          font-size: 22px;
          line-height: 1;
        }

        .media-icon-btn {
          font-size: 30px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: 0;
        }

        .media-option-grid button {
          min-height: 46px;
          border-radius: 999px;
          font-size: 12px;
          letter-spacing: 0.3px;
        }

        .media-action-divider {
          height: 1px;
          margin: 14px 6px 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
        }

        .grid-2,
        .grid-3,
        .grid-4,
        .grid-1 {
          display: grid;
        }

        .grid-1 {
          grid-template-columns: 1fr;
          gap: 12px;
          max-width: 150px;
          margin-left: auto;
          margin-right: auto;
        }

        .grid-2 {
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .grid-3 {
          grid-template-columns: repeat(3, 1fr);
          gap: 13px;
        }

        .grid-4 {
          grid-template-columns: repeat(4, 1fr);
          gap: 11px;
        }

        button {
          background:
            linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01)),
            linear-gradient(145deg, #212837, #151b28);
          color: var(--text-main);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 15px 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          box-shadow:
            0 10px 18px rgba(0,0,0,0.28),
            inset 0 1px 0 rgba(255,255,255,0.08);
          text-shadow: 0 1px 2px rgba(0,0,0,0.4);
          transition: transform 0.12s ease, box-shadow 0.16s ease, border-color 0.16s ease, color 0.16s ease, background 0.16s ease;
          position: relative;
          font-family: inherit;
          overflow: hidden;
          min-height: 52px;
        }

        button::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.08), transparent 38%);
          pointer-events: none;
        }

        .button-content {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          width: 100%;
          position: relative;
          z-index: 1;
        }

        .button-icon {
          width: 24px;
          height: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: currentColor;
          opacity: 0.92;
          flex: 0 0 auto;
        }

        .button-icon svg {
          width: 100%;
          height: 100%;
          display: block;
          fill: currentColor;
        }

        .button-label {
          display: inline-block;
          min-width: 0;
        }

        button.light-toggle-active {
          border-color: rgba(115, 215, 255, 0.28);
          background:
            linear-gradient(180deg, rgba(115,215,255,0.18), rgba(115,215,255,0.05)),
            linear-gradient(145deg, #243249, #18202d);
          color: #ecfbff;
          box-shadow:
            0 14px 24px rgba(0,0,0,0.3),
            0 0 0 1px rgba(115,215,255,0.1),
            inset 0 1px 0 rgba(255,255,255,0.12);
        }

        button:not(.d-btn):hover {
          border-color: rgba(115, 215, 255, 0.22);
          box-shadow:
            0 14px 24px rgba(0,0,0,0.32),
            0 0 0 1px rgba(115,215,255,0.08),
            inset 0 1px 0 rgba(255,255,255,0.1);
          transform: translateY(-1px);
        }

        button:not(.d-btn):active {
          background:
            linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01)),
            linear-gradient(145deg, #1a202d, #141925);
          box-shadow:
            inset 0 2px 8px rgba(0,0,0,0.36),
            0 4px 10px rgba(0,0,0,0.18);
          color: var(--accent);
          text-shadow: 0 0 10px rgba(115, 215, 255, 0.45);
          transform: translateY(1px) scale(0.99);
        }

        button.danger {
          color: #ffe4e8;
          border-color: rgba(255,122,140,0.18);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01)),
            linear-gradient(145deg, rgba(70, 30, 40, 0.95), rgba(35, 20, 26, 0.95));
        }

        button.danger:active {
          color: #fff5f7;
          text-shadow: 0 0 8px rgba(255, 122, 140, 0.48);
        }

        .collapse-panel {
          margin: 8px 0 2px;
          border-radius: 18px;
          background: rgba(13, 17, 25, 0.64);
          border: 1px solid rgba(255,255,255,0.05);
          overflow: hidden;
          box-shadow:
            0 12px 24px rgba(0,0,0,0.18),
            inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .collapse-panel summary {
          list-style: none;
          cursor: pointer;
          padding: 13px 16px;
          color: var(--text-sub);
          font-size: 11px;
          letter-spacing: 1px;
          user-select: none;
          text-transform: uppercase;
        }

        .collapse-panel summary::-webkit-details-marker {
          display: none;
        }

        .collapse-panel summary::after {
          content: "+";
          float: right;
          color: var(--accent);
          font-size: 14px;
          line-height: 1;
        }

        .collapse-panel[open] summary::after {
          content: "\\2212";
        }

        .collapse-content {
          padding: 2px 12px 12px;
        }

        .subtle-action-row {
          display: flex;
          justify-content: center;
          gap: 8px;
          flex-wrap: nowrap;
          margin-top: -2px;
          margin-bottom: 14px;
        }

        .subtle-btn {
          min-width: 0;
          flex: 1 1 0;
          max-width: 92px;
          padding: 9px 10px;
          border-radius: 999px;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01)),
            linear-gradient(145deg, #202633, #141924);
          color: #c5d1e7;
          font-size: 11px;
          letter-spacing: 0.4px;
          white-space: nowrap;
        }

        .subtle-btn:active {
          color: var(--accent);
        }

        .d-pad-wrapper {
          --dpad-size: 188px;
          --dpad-side-width: 68px;
          --dpad-gap: 12px;
          display: flex;
          justify-content: center;
          padding: 8px 0 20px;
        }

        .d-pad-layout {
          display: grid;
          grid-template-columns: var(--dpad-side-width) var(--dpad-size) var(--dpad-side-width);
          align-items: center;
          justify-content: center;
          gap: var(--dpad-gap);
          width: fit-content;
          max-width: 100%;
        }

        .d-pad-side {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .side-btn {
          min-height: 72px;
          padding: 14px 8px;
          font-size: 12px;
          line-height: 1.2;
          word-break: break-word;
          border-radius: 18px;
        }

        .d-pad {
          position: relative;
          width: var(--dpad-size);
          height: var(--dpad-size);
          background:
            radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08), transparent 34%),
            linear-gradient(180deg, #1d2432, #111620);
          border-radius: 50%;
          box-shadow:
            0 20px 30px rgba(0,0,0,0.24),
            inset 0 1px 0 rgba(255,255,255,0.07),
            inset 0 -18px 20px rgba(0,0,0,0.24);
          border: 1px solid rgba(255,255,255,0.06);
        }

        .d-pad::before {
          content: "";
          position: absolute;
          inset: 18px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.05);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
        }

        .d-btn {
          position: absolute;
          background: transparent !important;
          border: none;
          box-shadow: none !important;
          color: var(--text-main);
          font-size: 24px;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: all 0.1s ease;
          text-shadow: none;
          padding: 0;
          min-height: 0;
        }

        .d-up { top: 10px; left: 50%; transform: translateX(-50%); width: 66px; height: 50px; }
        .d-up:active { transform: translateX(-50%) scale(0.85); color: var(--accent); text-shadow: 0 0 10px rgba(115,215,255,0.8); }
        .d-down { bottom: 10px; left: 50%; transform: translateX(-50%); width: 66px; height: 50px; }
        .d-down:active { transform: translateX(-50%) scale(0.85); color: var(--accent); text-shadow: 0 0 10px rgba(115,215,255,0.8); }
        .d-left { left: 10px; top: 50%; transform: translateY(-50%); width: 50px; height: 66px; }
        .d-left:active { transform: translateY(-50%) scale(0.85); color: var(--accent); text-shadow: 0 0 10px rgba(115,215,255,0.8); }
        .d-right { right: 10px; top: 50%; transform: translateY(-50%); width: 50px; height: 66px; }
        .d-right:active { transform: translateY(-50%) scale(0.85); color: var(--accent); text-shadow: 0 0 10px rgba(115,215,255,0.8); }

        .d-ok {
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 76px;
          height: 76px;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02)),
            linear-gradient(145deg, #253145, #171d2a) !important;
          border-radius: 50%;
          font-weight: bold;
          font-size: 16px;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow:
            0 10px 18px rgba(0,0,0,0.32),
            inset 0 1px 0 rgba(255,255,255,0.1) !important;
        }

        .d-ok:active {
          transform: translate(-50%, -48%) scale(0.96);
          box-shadow: inset 4px 4px 8px rgba(0,0,0,0.6) !important;
          color: var(--accent);
          text-shadow: 0 0 10px rgba(115,215,255,0.6);
        }

        .bottom-nav {
          position: absolute;
          bottom: 14px;
          left: 14px;
          right: 14px;
          width: auto;
          background: rgba(14, 18, 27, 0.82);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 22px;
          box-shadow:
            0 16px 30px rgba(0,0,0,0.34),
            inset 0 1px 0 rgba(255,255,255,0.05);
          display: flex;
          justify-content: space-evenly;
          padding: 10px;
          z-index: 100;
        }

        .nav-item {
          background: transparent;
          box-shadow: none;
          border-radius: 16px;
          width: 72px;
          height: 56px;
          padding: 6px;
          font-size: 11px;
          color: var(--text-dim);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 0;
          border: 1px solid transparent;
        }

        .nav-item.active {
          background:
            linear-gradient(180deg, rgba(115,215,255,0.18), rgba(115,215,255,0.06)),
            linear-gradient(145deg, #202a3b, #161c28);
          box-shadow:
            0 10px 18px rgba(0,0,0,0.2),
            inset 0 1px 0 rgba(255,255,255,0.08);
          border-color: rgba(115,215,255,0.16);
          color: var(--accent);
          text-shadow: 0 0 5px rgba(115,215,255,0.3);
          transform: translateY(-1px);
        }

        .nav-icon {
          font-size: 16px;
          margin-bottom: 3px;
          line-height: 1;
        }

        .rename-modal {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(8, 12, 20, 0.62);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(10px);
          z-index: 200;
        }

        .rename-modal-card {
          width: min(100%, 320px);
          background:
            radial-gradient(circle at top, rgba(115,215,255,0.14), transparent 34%),
            linear-gradient(180deg, #1e2635, #131a26);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 20px;
          box-shadow: 0 24px 50px rgba(0,0,0,0.45);
        }

        .rename-modal-title {
          font-size: 17px;
          font-weight: 700;
          color: #f2f2f4;
          margin-bottom: 8px;
        }

        .rename-modal-subtitle {
          font-size: 12px;
          color: #9b9ba6;
          line-height: 1.5;
          margin-bottom: 14px;
        }

        .rename-modal-input {
          width: 100%;
          margin-bottom: 14px;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(8,12,18,0.46);
          color: #f2f2f4;
          font-size: 14px;
          outline: none;
        }

        .rename-modal-input:focus {
          border-color: rgba(115,215,255,0.45);
          box-shadow: 0 0 0 3px rgba(115,215,255,0.12);
        }

        .rename-modal-actions {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .rename-modal-actions button {
          padding: 11px 8px;
          font-size: 12px;
        }

        .rename-modal-secondary {
          color: #b5b5be;
        }

        .rename-modal-accent {
          color: var(--accent);
        }

        .rename-sync-hint {
          margin-top: 12px;
          font-size: 11px;
          color: #7d7d88;
          line-height: 1.5;
        }

        .rename-status {
          min-height: 16px;
          margin-top: 10px;
          font-size: 11px;
          line-height: 1.4;
          color: #7d7d88;
        }

        .rename-status.error {
          color: #ff8b95;
        }

        @media (max-width: 420px) {
          .device {
            width: 100%;
            height: calc(100vh - 24px);
            border-radius: 28px;
          }

          .d-pad-wrapper {
            --dpad-size: 168px;
            --dpad-side-width: 62px;
            --dpad-gap: 8px;
          }

          .d-pad-layout {
            grid-template-columns: var(--dpad-side-width) var(--dpad-size) var(--dpad-side-width);
            gap: var(--dpad-gap);
          }

          .d-pad {
            margin: 0 auto;
          }

          .side-btn {
            min-height: 64px;
            font-size: 11px;
            padding: 10px 6px;
          }

          .bottom-nav {
            left: 10px;
            right: 10px;
            bottom: 10px;
          }

          .media-transport-layout {
            grid-template-columns: 1fr;
          }

          .media-transport-btn {
            min-height: 56px;
          }
        }
      </style>
      <div class="device">
        <div class="header" id="header-title">
          <div class="header-title" id="header-title-text">
            ${this._renderLogo()}
          </div>
        </div>
        <div class="content-area">
          ${this._renderPages()}
        </div>
        <div class="bottom-nav">
          ${this._renderNavButton("scene", "\u25ce", "\u573a\u666f")}
          ${this._renderNavButton("media", "\u25b6", "\u5f71\u97f3")}
          ${this._renderNavButton("ktv", "\u266b", "KTV")}
          ${this._renderNavButton("home", "\u2302", "\u8bbe\u65bd")}
        </div>
        ${this._renderRenameDialog()}
      </div>
    `;

    this._bindEvents();

    const renameInput = this.shadowRoot.getElementById("rename-scene-input");
    if (renameInput) {
      renameInput.focus();
      renameInput.select();
    }
  }

  _resolveTitle() {
    if (this._page === "scene" && this._config?.title) {
      return this._config.title;
    }
    return this._titleMap[this._page] || this._config?.title || "鏅鸿兘涓帶";
  }

  _renderLogo() {
    const title = this._escapeHtml(this._resolveTitle());
    return `<img class="header-logo" src="${this._logoUrl}" alt="${title}" />`;
  }

  _resolveLogoUrl() {
    if (this._config?.logo_url) {
      return this._config.logo_url;
    }
    const base64 =
      "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iX+WbvuWxgl8xIiBkYXRhLW5hbWU9IuWbvuWxgiAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2aWV3Qm94PSIwIDAgNDQ0IDE3NCI+CiAgPGltYWdlIHdpZHRoPSIxODUwIiBoZWlnaHQ9IjcyNSIgdHJhbnNmb3JtPSJzY2FsZSguMjQpIiB4bGluazpocmVmPSJkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQnpvQUFBTFZDQVlBQUFDNERlZlZBQUFBQ1hCSVdYTUFBQzRqQUFBdUl3RjRwVDkyQUFBZ0FFbEVRVlI0bk96ZFRYSWNSNVl1VUM5MXpYclFtTGpabXhXMGdnSjdBd0pYVU9BS0ttQ3hBSkVySUxrQ2dBc0lnMnY0Um9SV1FIQUZTSzJBcU5remk0SFFrNTdxbWFzY1Vnb0NTZnhFeHArZll3WURLS21RRWRjelVUUjhlZS85U3dBQUFBQUFZRFZpbXc1Q0NIdjN1WisrYXk2Y1BBQkxKZWdFQUFBQUFOaVJPMExIL1BYQkhZLzIzV2V1NEhQLy9WU3V5c2RkTmlHRS83bjF6Mi8vOTlkOTEydzgzd0FZZ3FBVEFBQUFBT0FyYmdXVzIxLy9MWVN3di9XL3ZuYzNKYis2TGdIcGplMndkRHNrdmVxNzVuTUJLd0NWRW5RQ0FBQUFBRldLYmRyZkNpa1B5K2Z0NEZKb09VK2JFcEJtSDh2bjMwSlI0M2dCNmlIb0JBQUFBQUJXWnl2RXZCbjkrbDliSTJBRm1IVzRDVVJ6QVBxdnJlNVI0M01CVmtMUUNRQUFBQUFzVG16VFRZQjVFMmorYmV2cmZTZktQVnh2aGFFL2JmM1ptRnlBaFJCMEFnQUFBQUN6dE5XVmVkT0IrZDFXaHliczJrMEkrbEVJQ2pCUGdrNEFBQUFBWUZLeFRZZGJBZWJmeTllSFRvVVp1OWpxQkwwSlFJM0RCUmlab0JNQUFBQUFHRVZzMDhIV3VObnZqSmxsaFRabEo2Z0FGR0FFZ2s0QUFBQUFZRkJiK3pNUFM0Zm12bkd6Vk83aVZnQzY2YnZtdXZhaUFEeVZvQk1BQUFBQWVMU3lSL09tVS9PN3JYMmF3SmRkbGREenB4S0VDajhCSGtqUUNRQUFBQURjeTYxT1RhRW1ERS80Q2ZBQWdrNEFBQUFBNEU1bHArYk4rTmxEK3pSaEVqZmg1OGNTZkY0NEJvQi9FM1FDQUFBQUFMK0piY3FCNXZjbDJOU3RDZk4wY1N2OHZISk9RSTBFblFBQUFBREFiMktibWhEQ21ZckFvbHlWOFBQWGtiZDkxMndjSDFBRFFTY0FBQUFBOEp2WXBqeWU5cE9Ld0tKZGwrRHpvK0FUV0ROQkp3QUFBQUR3QjdGTmx5R0VBMVdCMVJCOEFxc2s2QVFBQUFBQS9pQzI2U1NFOEZKVllMVzJnODl6T3o2QnBSSjBBZ0FBQUFCL0VOdDBGRUo0cnlwUWphdGJ3ZWUxb3dlV1FOQUpBQUFBQVB4SmJOTXZxZ0xWeXFOdGZ5eGpiaTg4RFlDNUVuUUNBQUFBQUg4UzIvUWhoSENvTWxDOW16RzNQK3IyQk9aRzBBa0FBQUFBL0Vsc1U5N1JlYUl5d0MyYnJkQnpvempBbEFTZEFBQUFBTUNmeERZZGhCQXVWUWI0Z3B2ZG5qLzJYWE91VU1EWUJKMEFBQUFBd0oxaW0zNE9JZXlwRG5BUFJ0d0NveE4wQWdBQUFBQjNpbTA2Q3lFMHFnTTh3bmtKUFMvNnJybFNRR0FYQkowQUFBQUF3SjFpbTNMSWVhWTZ3QlBsWFo0L2xFNVBvU2N3R0VFbkFBQUFBSENuMktiOUVNSW4xUUVHSlBRRUJpUG9CQUFBQUFBK0s3YnBNb1J3b0VMQUR1VFE4NTJkbnNCakNUb0JBQUFBZ00rS2JUb0pJYnhVSVdESGJuWjZDajJCZXhOMEFnQUFBQUNmRmR0MEZFSjRyMExBaUZJT1BmdXVPVmQwNEVzRW5RQUFBQURBRjhVMi9hSkN3QVN1UytqNVE5ODFHd2NBM0Nib0JBQUFBQUMrS0xicFF3amhVSldBQ1YxdDdmTzhjaEJBOXMwTXJnRUFBQUFBbUxjZm5ROHdzZjBRUXQ0Wi9DbTI2WDBacXcxVVRrY25BQUFBQVBCRnNVMEhJWVJMVlFKbTVtYTA3VHRkbmxBblFTY0FBQUFBOEZXeFRUK0hFUFpVQ3BpcHpkWm8yMnVIQkhVd3VoWUFBQUFBdUk5elZRSm1MSGVlbjVYUnRtZWxFeDFZT1VFbkFBQUFBSEFmSDFVSldJRGNlZDdrY2R1eFRSOWlteHFIQnV0bGRDMEFBQUFBOEZXeFRmdTVVMHFsZ0FXeXl4TldTdEFKQUFBQUFOeExiTk5sR1E4SnNGVG5KZkM4Y0lLd2ZJSk9BQUFBQU9CZVlwdE9RZ2d2VlF0WWdkelorVFlIbjMzWFhEdFFXQ1k3T2dFQUFBQ0ErN0tuRTFpTFBJNzdMSS9rem0vaUtPTzVnWVhSMFFrQUFBQUEzRnRzMHkrcUJheFUzdVA1ZzdHMnNCeUNUZ0FBQUFEZzNtS2JQb1FRRGxVTVdMR0xFbmdtaHd6ekp1Z0VBQUFBQU80dHRpbnY2RHhSTWFBQzluakN6QWs2QVFBQUFJQjdpMjA2Q0NGY3FoaFFrUnh5dmdzaG5BbzhZVjRFblFBQUFBREFnOFEyL1J4QzJGTTFvRExYWlkvbnU3NXJyaHcrVE84Ylp3QUFBQUFBUE5DNWdnRVZ5bS93eU9PN1A4VTJuY1UyN1hzU3dMUUVuUUFBQUFEQVEzMVVNYUJ5amNBVHBtZDBMUUFBQUFEd0lPV1grcDlVRGVBM055TnROMG9DNHhGMEFnQUFBQUFQRnR0MEdVSTRVRG1BUDdnSUlienR1K1pDV1dEM2pLNEZBQUFBQUI3REwvRUIvdXd3aFBBaHRpbC9IS29QN0phZ0V3QUFBQUI0REhzNkFUN3ZKdkMwd3hOMnlPaGFBQUFBQU9CUllwdCtVVG1BZTBsbHBPMlZjc0Z3ZEhRQ0FBQUFBSTlsZkMzQS9UUWhoRTg2UEdGWWdrNEFBQUFBNExGK1ZEbUFCN2tKUEU5aW0vYVVEcDdHNkZvQUFBQUE0RkZpbXc1Q0NKZXFCL0FvMXlHRWR5R0UwNzVycnBVUUhrN1FDUUFBQUFBOFdtelR6eUVFWFVrQWo1ZER6bGQ5MXlRMWhJY3h1aFlBQUFBQWVJcHoxUU40a3Z4bWtieTdNNCswUFZKS3VEOUJKd0FBQUFEd0ZCOVZEMkFRK3lHRTk3Rk5IMktiRHBVVXZzN29XZ0FBQUFEZzBXS2I4aS9tUDZrZ3dPRHlLTnUzZmRkY0tTM2NUZEFKQUFBQUFEeEpiTk5sQ09GQUZRRjI0bTBJNGJUdm1tdmxoVDh5dWhZQUFBQUFlS29MRlFUWW1kZTVjejYycVZGaStDTkJKd0FBQUFEd1ZQWjBBdXpXWGdqaHpQNU8rQ09qYXdFQUFBQ0FKNHR0K2tVVkFVYVQ5M2UrTXM2VzJ1bm9CQUFBQUFDR1lId3R3SGlhTXM3MmpacFRNMEVuQUFBQUFEQ0VIMVVSWUZSNW5PM3IyS1pQeHRsU0swRW5BQUFBQURBRUhaMEEwOWdQSWVUZG5lOWptL2FjQVRXeG94TUFBQUFBR0VSczA4K2x3d2lBYWVTZG5XLzdyamxWZjJxZ294TUFBQUFBR01xNVNnSk1Lci9aNUNTMjZUSzI2Y0JSc0hhQ1RnQUFBQUJnS0I5VkVtQVdjc2ladzg0VDQyeFpNMEVuQUFBQUFEQVVlem9CNXVWbENUeVBuQXRyWkVjbkFBQUFBRENZUEM2eGRCSUJNQzk1dlBoeDN6WFh6b1cxME5FSkFBQUFBQXhKVnlmQVBPV3V6ayt4VFMrZEQyc2g2QVFBQUFBQWhtUlBKOEI4NVgyZGVXL25oOWltZmVmRTBobGRDd0FBQUFBTUtyYnBGeFVGbUwwOHd2WnQzelduam9xbDB0RUpBQUFBQUF6TitGcUErZFBkeWVMcDZBUUFBQUFBQmxYMnY1Mm82aXg5TFlUT0hWNC9QZUhDLzE3Q2t5ODVYRzc1WUxWMGQ3SklnazRBQUFBQVlGQ3hUUWNoaEV0VkhkUlYrUWgzaEpINXo1dGJEN2JwdStaNktUZFh1c20yTzhweVdIcXc5ZWUvYmYzNzIvOE9HRTUrTThSeDN6Vlhhc29TQ0RvQkFBQUFnTUhGTnYxOGo4NisydDEwVitaQTRWL2w2MDBKTHNQU3dzb3AzQXBJRDhwejdyKzJndEFEejBONE1OMmRMSWFnRXdBQUFBQVlYR3pUV1FpaHFiU3kyeDJXSDh2bm13RHpTcWZVK0xZQzBadVBtekQwZGljcDhEdmRuY3llb0JNQUFBQUFHRnhzVXc0NXoxWmMyWXV0RWJJM3dlWjEzelczUjhpeUFGdEI2RTBINkhkRzVNS3Zya3ZZZWE0Y3pKR2dFd0FBQUFBWVhBbU9QaTI0c2pmaDVjMVkyWnNnOCtJZS8xdFdwT3ljemFIbjRkYXUwRU5uVEdYT1MrQnBuRGF6SXVnRUFBQUFBSFlpdHVseUFSMXhOeU5sUDVaUTg4cHVUTzZqaFBrSDVlUHZXeDJoc0ZaWEplejBoZzltUTlBSkFBQUFBT3hFYk5OSkNPSGxUS3A3MDUzNTA4M1h4c3l5QzdGTmgxdmg1NEh3a3hVNjdidm1sWU5sRGdTZEFBQUFBTUJPeERZZGhSRGVqMXpkbTVHekg3ZTZNd1dhVEVyNHlRcmxuNnN2K3E2NWNyaE1TZEFKQUFBQUFPeE1iTk12Ty96Mm0vS1JkMmhlR0RuTFVzUTI3Wld3TXdlZzM1V3Y5eHdnQzVOLzNyN3F1eVk1T0tZaTZBUUFBQUFBZGlhMjZVTUpjNTdxSnRUOHFRU2Fkc1N4S3JGTk44SG4zOHZuZlNmTVFxUVNlSHFqQ2FNVGRBSUFBQUFBT3hQYmxIZDBuanp3K3dzMXFWNXMwLzVXeDZmZ2s3bTdLcU5zalFwblZJSk9BQUFBQUdCblNwZmE1UmUrLzNVWk8vdVQ4YlB3ZWJlQ3p5T2picG1wM05sNTZuQVlpNkFUQUFBQUFOaXAyS2FmdDBLWnpYYXcyWGZObGVyRHcyMk51cjBKUG1FdXprTUl4OTYwd2hnRW5RQUFBQURBVHNVMk5YbXNvUkcwc0R1eFRVZGJvYWN4dDB6TktGdEdJZWdFQUFBQUFJQVZLV051YytENWo5TDFDVk14eXBhZEVuUUNBQUFBQU1CS3hUYnRsZERUYmsrbWtrcmdhWlF0Z3hOMEFnQUFBQUJBSmNxSTIzOElQUm5acHV6dE5NcVdRUWs2QVFBQUFBQ2dRckZOQnlHRWY5cnJ5VWl1UzloNXJ1QU1SZEFKQUFBQUFBQ1ZFM295b3RPK2ExNHBPRU1RZEFJQUFBQUFBTDh4M3BZUlhJUVFYdGpieVZNSk9nRUFBQUFBZ0R1VjBQT20weE9HZEZYQ1RuczdlVFJCSndBQUFBQUE4RVd4VFhzbDdQdytoSENnV2d3a2QzUys2cnNtS1NpUEllZ0VBQUFBQUFEdUxiWnB2d1NlOW5reUZIczdlUlJCSndBQUFBQUE4Q2hHMnpLZzh4RENzYjJkUElTZ0V3QUFBQUFBZUpMUzVYa3oybGFYSjQrMUtXR252WjNjaTZBVEFBQUFBQUFZakM1UG5paDNkTDdvdStaQ0lma2FRU2NBQUFBQUFEQzQwdVhabEM3UFBSWG1nWEpuWjFJMHZrVFFDUUFBQUFBQTdGUnNVMU82UEE5Vm1nZElmZGNjS3hpZkkrZ0VBQUFBQUFCR0VkdDBXQUxQUnNXNXAvUFMzWG10WU53bTZBUUFBQUFBQUVabHJDMFB0QWtoUEJkMmNwdWdFd0FBQUFBQW1FUnNVdzQ1ajBJSXIwTUkrMDZCTDdndVllZEdrYmdoNkFRQUFBQUFBQ1pYOW5qbURzOERwOEZuWEpjeHR1Y0tSQkIwQWdBQUFBQUFjMUwyZU9ZT3owTUh3MmZrc0RNcERvSk9BQUFBQUFCZ2RrcmcrWDBaYlF1M3ZlMjc1bzJxMUUzUUNRQUFBQUFBekZaczAzN3A4R3ljRXJla3ZtdU9GYVZlZ2s0QUFBQUFBR0QyQko1OHhua1paWHV0UVBVUmRBSUFBQUFBQUlzaDhPUU9teERDYzJGbmZRU2RBQUFBQUFEQTRnZzh1U1dIblMvNnJybFNtSG9JT2dFQUFBQUFnTVdLYlRvSUlaeUVFQTZkWXZXdVMyZm5wdlpDMUVMUUNRQUFBQUFBTEY1czAySHA4QlI0MWszWVdSRkJKd0FBQUFBQXNCb2w4RHdMSWV3NzFXcmxzUE80NzVyejJndXhkb0pPQUFBQUFBQmdkV0tibXRMaEtmQ3NWdzQ3VSsxRldETkJKd0FBQUFBQXNFcXhUWHNoaEpjaGhPOURDSHRPdVVyQ3poVVRkQUlBQUFBQUFLdFdBcytURUVManBLc2s3RndwUVNjQUFBQUFBRkNGMkthREVuZ2VPdkhxdk8yNzVrM3RSVmdiUVNjQUFBQUFBRkNWMkthakVuamEzMW1YMUhmTmNlMUZXQk5CSndBQUFBQUFVS1hZcGpmMmQxWkgyTGtpZ2s0QUFBQUFBS0Jhc1UzN3Bidnp5TE9nR3NMT2xSQjBBZ0FBQUFBQTFZdHR5bnM3ejR5enJZYXdjd1VFblFBQUFBQUFBSVZ4dGxVUmRpNmNvQk1BQUFBQUFHQ0xjYlpWRVhZdW1LQVRBQUFBQUFEZ0RyRk5SeVh3Tk01MjNZU2RDL1ZON1FVQUFBQUFBQUM0Uzk4MTV5R0VaeUdFVXdWYXRTYTI2YXoySWl5UmprNEFBQUFBQUlDdmlHMDZMTjJkQjJxMVdqbzdGMGJRQ1FBQUFBQUFjRSt4VFc5Q0NLL1ZhN1dFblFzaTZBUUFBQUFBQUhpQTJLYmMxWG1tdTNPMWhKMExJZWdFQUFBQUFBQjRCTjJkcXlic1hBQkJKd0FBQUFBQXdDUHA3bHcxWWVmTUNUb0JBQUFBQUFDZVNIZm5hZ2s3WjB6UUNRQUFBQUFBTUFEZG5hdjFxdSthMDlxTE1FZmYxRjRBQUFBQUFBQ0FJZlJkc3draFBBOGhDTVhXNVNTMnFhbTlDSE9rb3hNQUFBQUFBR0Jnc1UySElZVDNJWVE5dFYyTjQ3NXJVdTFGbUJNZG5RQUFBQUFBQUFQcnUrWWloUEJ0Q09GY2JWZmpUR2Zudk9qb0JBQUFBQUFBMktIWXBwY2hoTmU2TzFmamVRbXltWmlnRXdBQUFBQUFZTWRpbXc1eVIyQUk0VUN0RisrNmhKMmIyZ3N4TlVFbkFBQUFBQURBU0dLYlRrSUlMOVY3OFlTZE15RG9CQUFBQUFBQUdGRnMwMUhwN2pUS2R0bHkyUGx0M3pYWHRSZGlLdC9VZWRzQUFBQUFBQURUNkx2bVBJVHdMSVNnRzNEWmNsRDlJYlpKWUQwUkhaMEFBQUFBQUFBVE1jcDJGVFpsakszT3pwSHA2QVFBQUFBQUFKaEkzeld2UWdndnloaFVsdWtnaEhEaTdNYW5veE1BQUFBQUFHQmlzVTBIWlcvbmdiTllyTlIzelhIdFJSalRmOVJ6cXdBQUFBQUFBUFAwdjVmbi8rOC8vL3ZvLzRZUS9vK3djN0VPL3ZPL2ovN3l2NWZuRjdVWFlpdzZPZ0VBQUFBQUFHWWt0dW1sVWFpTGR0eDNUYXE5Q0dNUWRBSUFBQUFBVktLTXh0ejd6TjBlRGxTRnpXZDJEVjczWGJQeFhJUDdLYS9YRDE5NHpUSnZ6L3V1MGRtNVk0Sk9BQUFBQUlDRmlXMjZDU1gzYm8yNC9HN3I2OXYvYm82MlE5SDgrYWV0YTd3SkNBU2tWQ3UyYWErRW5VYlpMczkxQ1R2OS9Ob2hRU2NBQUFBQXdFekVOdTJIRVBadmhaUTM0ZVdYdWpGcmNST01Yb1VRL2xXKzNnaERXYnZZcHJNUVF1T2dGeWYvckhyV2Q4MWRYZTRNUU5BSkFBQUFBRENpMG8xNUUyVCtyUVNiTng4OHpVM3dlUk9FNXM5WHhrZXlCdloyTHRhbWRIWUtPM2RBMEFrQUFBQUFNTEN0enN6RHJUQlRSK2EwYmtMUVRRbEJmLzFhK01DU2xEZEt2UGV6WkhITys2NTVVWHNSZGtIUUNRQUFBQUR3U0dWLzNzR3RRUE5RUFJmbEpnRDlXRHBBTjhiZ01tZXhUZmxuenBtOW5ZdHoybmZOcTlxTE1EUkJKd0FBQUFEQVBaUXV6WVB5OFowT3pkVzdLQUhvVDhKUDVxYTh5ZUs5TjFZc3puSGZOYW4ySWd4SjBBa0FBQUFBY0VzSkVRNkZtbXpaN3Z5OE1QYVdPWWh0eXAyZGpjTllsT2YyQmc5SDBBa0FBQUFBVksrTWdzekI1dC9MNS8zYWE4SzliRXJvbWJzK0wvcXV1VkkyeGhiYjlES0VjS0x3aTNGZHdrNWQ0Z01RZEFJQUFBQUExWWx0T3J3VmJPcldaQWhYSmZqOEtQaGtUTEZOVFFrNy9TeGJoazBKTzNXRlA1R2dFd0FBQUFCWXZhMk96VHlHOXNpSk01TE5yZUJUcU1IT2xKOXpINFNkaTNIZWQ4Mkwyb3Z3VklKT0FBQUFBR0IxeW83Tm82MWcweS8rbVlNY2V2NVlRazlqS3hsY2JGTWV1LzIrN0JWbS9rNzdybm5sbkI1UDBBa0FBQUFBckVMcFpzcWg1ai84a3A4RnlHTnR6M08zWjk4MTV3Nk1vWlEzZW56d2MzQXhqdnV1U2JVWDRiRUVuUUFBQUFEQW9wV0FNM2N3N1R0SkZ1cDZxOXZ6M0loYm5xcUVuWGxuWjZPWXMzZGQ5blhxOG40RVFTY0FBQUFBc0hpeFRiODRSVmJrWE9qSkVHS2J6b1NkaTVCZjU5OTZ2VCtjb0JNQUFBQUFXTHpZcHZkbGJDMnNqZENUSjRsdGVoTkNlSzJLczdmcHUrWlo3VVY0cUcrV2Ria0FBQUFBQUhmNlVWbFlxUnpnNTY2OG4zT2dIOXVrTzQ4SDZic21CNTNIcWpaN0I2VURsd2ZRMFFrQUFBQUFMRjVzVTk3UCtjbEpVb25yMHVuNVE5ODFGdzZkK3lnaHVTQnQvbzc3cmttMUYrRytCSjBBQUFBQXdDckVObDNtamhpblNXV3VjdUFaUWtoOTExdzVmTDRrdHVrd2hKQkhmZThwMUd6bE56STg3N3RtVTNzaDdzUG9XZ0FBQUFCZ0xZeXZwVWI3WmYvaXA5aW1EMGJiOGlXbEEvaDVDZE9ZcHh4QzV6SFZ3dWg3ME5FSkFBQUFBS3hDYkZQdTVyeDBtdkJyaUpWSFg3N1Q1Y2xkeXMvTER6bzdaKzJpNzVybnRSZmhhd1NkQUFBQUFNQnF4RFo5S2gxdXdMOWRsRjJlZHY3eEI4TE9SWGpiZDgyYjJvdndKWUpPQUFBQUFHQTFZcHZPUWdoR2Q4S2YyZVhKbjVTdzg3MDNpTXphaTc1cnptc3Z3dWNJT2dFQUFBQ0ExWWh0T2lxL3RBYys3MmFzN1VhTktMc2djMmZuUWZYRm1LYzhpdnFaTnlqY1RkQUpBQUFBQUt4S2JOTXZUaFR1NWFJRW5yckZLaWZzbkwxTjN6WFBhaS9DWGI2WjN5VUJBQUFBQUR5SjBBYnU1ekIzUU9mZHRyRk5SajVYck8rYTNEWDRQQWRxdGRkaXBnNWltMDVxTDhKZGRIUUNBQUFBQUt0U0Fwc3pwd29QbHNPdWR5R0UweEo4VVJtZG5iTm5YK2N0Z2s0QUFBQUFZRlZpbS9aRENKK2NLanlhd0xOaXdzNVpzNi96RmtFbkFBQUFBTEE2c1UyWGZra1BUeWJ3ckpTd2M5YnM2OXhpUnljQUFBQUFzRVkvT2xWNHNoeDJ2YzRkMHJGTmIwcjRSUVhzN0p3MSt6cTM2T2dFQUFBQUFGWW50aWwzSVYwNldSaVVEcy9LNk95Y3RlcjNkUVpCSndBQUFBQ3dWckZOZVUvbnZnT0d3UWs4S3lMc25LM3E5M1VHbzJzQkFBQUFnQlc3Y0xpd0U5c2piVjhxOGJwdGpiRVZhczlMZmgyZTFWNEVRU2NBQUFBQXNGYjJkTUp1NWFEbEpIZFB4elkxYXIxZXdzN1pPc3o3YzJzdWdORzFBQUFBQU1CcXhUYjk0blJoTkpzUXdxdSthM1JUcjFUWmYveWhoTnpNeC9OYVgzYzZPZ0VBQUFDQU5UdDN1akNhWDBPdzJLYjNzVTMyNDY1UTN6VWJuWjJ6ZEZaMnFWWkgwQWtBQUFBQXJKbnh0VEMrbzdLLzgwMnQ0Y3VhQ1R0bmFiL1dmWjJDVGdBQUFBQmd6WXpRaE9tOExvR24vWjByVThMTzQ5cnJNRE5ITmI3VzdPZ0VBQUFBQUZZdHR1bXlqTlFFcHBQZmRQRFcvczUxS2NGYWxaMkVNNVc3YkovMVhYTlZ5dzNyNkFRQUFBQUExczc0V3BqZVlkbmZlV0tjN1hyMFhaTjBkczdLWG0zQnM2QVRBQUFBQUZpN2N5Y01zL0hTT050MUtXSG5hZTExbUpIRHZCKzNscHMxdWhZQUFBQUFXTDNZcGs4aGhIMG5EYk9TeDlnZTF6Um1jODFpbTNJbm9RQjdQcDZWWGFxcnBxTVRBQUFBQUtpQnZZQXdQNGVsdTdPYTdyTTE2N3NtajdCTnRkZGhSczVxR0JNdDZBUUFBQUFBYW1CUEo4elg2OWlteTlpbUEyZTBlSzlDQ0t2dklseUkvSHA2dmZhYk5Mb1dBQUFBQUtoQ2JOTXZUaHBtTCs5NmZOdDN6YldqV3FiU1JmaWhCRzFNNzNuZk5hdWRhcUNqRXdBQUFBQ294Ym1UaHRsN0dVTEkzWjJIam1xWlNraWR4OWdLcStkaDFTTnNCWjBBQUFBQVFDMk1yNFZsMk04ZGdiRk5KODVybWZxdXllTnJud3M3WjJGL3pTTnNqYTRGQUFBQUFLb1EyNVIvMmZ2SmFjT2k1TURzdUFSbkxFeHNVNU03Q3AzYkxLeHloSzJPVGdBQUFBQ2dDbjNYWEpYUUJGaU9nekxLOW8welc1NithMUlaWTh2MDNxOXhoSzJnRXdBQUFBQ29pZkcxc0V5dlk1cytsTTVzRnFTRW5jbVpUVzV2amQyMWdrNEFBQUFBb0NiblRoc1c2N0IwZHphT2NGbjZyc2xkbmFzYm03cEFSN0ZOUjJ1NklUczZBUUFBQUlDcXhEYmxQWjI2d21EWmNvZmdxNzVycnAzak1wU3hxUi9LT0dLbWs4ZTRQMXZMYTBkSEp3QUFBQUJRRzExRnNIeE42ZTRVbWkxRUNkWmVoQkNFMDlQS2IvUjV2WmFiRVhRQ0FBQUFBTFd4cHhQV1liK0VuUytkNXpMMFhaTzdDWi9YWG9jWmVCbmJkTGlHR3pHNkZnQUFBQUNvVG16VEwwNGRWaVh2M3owMnluWVp5cDdWczlyck1MRlZqTERWMFFrQUFBQUExT2pjcWNPcUhCbGx1eHg5MTZTeVo1WHByR0tFcmFBVEFBQUFBS2lSOGJXd1BqbTQrVkM2QlptNXZtdU83VXllM09KSDJBbzZBUUFBQUlBYStlVTZyTk5lSG9rYTIyUXM2aks4S0NOVW1jN0prbXR2UnljQUFBQUFVS1hZcHNzUWdqR1hzRjZiRU1KemV6dm5yWXdiL2xCQ2FxYnh0dSthTjB1c3ZZNU9BQUFBQUtCV3h0ZkN1dVVBN1pPOW5mUFdkMDBPcEYvVlhvZUp2WTV0MmwvaWhRczZBUUFBQUlCYW5UdDVXTDNjSlhocGIrZTg5VjJUUWdpbnRkZGhZb3NjOTJ4MExRQUFBQUJRcmRpbVR5R0VSWGF4QUErVytxNDVWcmI1aW0zS0kyd1BhNi9EaEk1TDZMd1lPam9CQUFBQWdKcGRPSDJvUnBPRHROZ211eURuNjBVSTRhcjJJa3pvWkdtdkQwRW5BQUFBQUZBemV6cWhMcmxiOElPOW5mUFVkODExQ1R1WlJnNDVUNVpVZTBFbkFBQUFBRkF6SFoxUW53Tmg1M3oxWGJQSkkxUnJyOE9FY3VmellzWUhDem9CQUFBQWdHcVY3cUZ6endDb1R1NWN1NHh0YWh6OS9KUTlrWXZhRmJreVowdTVIVUVuQUFBQUFGQzdqN1VYQUNwMkZ0djB4aE5nbGw2RkVEYTFGMkVpKzB0NVhRZzZBUUFBQUlEYTZlaUV1cjJPYlZwTUIxc3RTc2Q5SG1GN1hYc3RKdko5Yk5QKzNDOVMwQWtBQUFBQVZLM3ZtaXRkUTFDOXZKZndmV3pUWHUyRm1KT3lyL05WN1hXWVNINHRuTXo5SWdXZEFBQUFBQUFoWEtnQlZPOG9oUEJCMkRrdjluVk82aWkyNldqT0Z5am9CQUFBQUFBSTRRYzFBRUlJQnlYc25QM0l6c3JZMXptZGt6bUgvNEpPQUFBQUFLQjZaVHlpUFhCQUtHSG5aV3pUZ1dyTWczMmRrOHFoLzh1NVhweWdFd0FBQUFEZzM4N1ZBU2oyU21lbnNITW03T3VjMVBkejdYSVdkQUlBQUFBQS9OdVA2Z0JzRVhiT1ROblg2VTBwNDh1dmhaTTVYcGlnRXdBQUFBRGczeTdVQWJobHI0eXhiUlJtTnZJSTI2dmFpekNCbzlpbXc3bGRsS0FUQUFBQUFPRDNIWEE2aFlDN25Bazc1Nkg4ckg1UmV4MG1jamEzQ3hKMEFnQUFBQUQ4N3FOYUFKOGg3SnlKc3EvemJlMTFtTUIrYk5QTE9WMlFvQk1BQUFBQTRIYzZPb0V2RVhiT1JOODFiNHdjbjhUcjJLYTl1VnpNWDJad0RRQUFBQUFBc3hIYmRCbENPSmpSSlczL0lqK1BiUHpwQy8vK04zM1hQRGtBaUcwNktEc0tiN3Y5ei8rKzllZjk4Z0ZyZHR4M1RYTEMwNHB0eWo5ckxqL3pjNHJkU1gzWEhNK2h2b0pPQUFBQUFJQXRzVTBuSVlSZGorYTdLaC9id2VXbS9IbVFrSElPU2doeEUzb2Vsczgzb2FoQWxLVVRkczVBYk5OUkNPRjk3WFdZd0xNeVFuaFNnazRBQUFBQWdDMmxpL0h5aVRXNUNTM3o1Ly9aL25QZk5kZnEvYnV0TVBTbVMvUzc4bmxPWGJYd09jTE9HWWh0eWtIblVlMTFHTmxGM3pYUHA3NElRU2NBQUFBQXdDMnhUVC9mWXhUaVRWZm14NjFRODZydm1pdjFITWJXNk56Y0RmcTNFbjRLUUprYlllZkV5czdJVDBiWWp1NUYzeldUN3JZV2RBSUFBQUFBM0JMYmRCWkNhTW8vM1pSQTg2ZXRNSFB5Y1gwMUt3SG9RUm1EZTdBMUZoZW1JdXljV0d4VC9qbndvZW9pakMvLy8rRzNVMTZBb0JNQUFBQUE0SmFiY2FwcjJaVlpnMXZoNTZIT1R5WWc3SnpZU0R1VythTlhmZGVjVGxVVFFTY0FBQUFBQUt0VU9yd095OTVQWForTVFkZzVvVExDOXJMcy9XVWNlWFQ3dDFQdG54WjBBZ0FBQUFCUUJjRW5JM2xtdlBWMGpMQ2R4R25mTmErbWVHQkJKd0FBQUFBQVZTcUJ5RCtNdW1WZ3ViUHR1YkJ6T2tiWVRpSjNkVjZOL2NDQ1RnQUFBQUFBcWxmMnNtNEhuM3UxMTRRbkVYWk95QWpiU2FTK2E0N0hmbUJCSndBQUFBQUEzQkxiZEZSRzNCNEpTM2drWWVlRWpMQ2RSSDYrWDR6NXdJSk9BQUFBQUFENGd0aW1QTmIybjBKUEhtRlR3cDlyeFJ1ZkViYWp1K2k3NXZtWUR5cm9CQUFBQUFDQWV4SjY4Z2pDem9rWVlUdUpGMzNYbkkvMXdJSk9BQUFBQUFCNGhLM1FzN0hUazY4WXZkT05melBDZG5SWGZkZDhPOWFEQ2pvQkFBQUFBT0NKeWs3UG0wNVB1RXZxdStaWVpjWm5oTzNvanZ1dVNXTThxS0FUQUFBQUFBQUdVa1psTmlYMFBGQlhiam50dSthVm9vekxDTnZSWFlVUW5vMHhybG5RQ1FBQUFBQUFPMUJHMjM1ZnVqeU50dVhHYU4xdS9LNTBYYjlYa3RHODdidm16YTRmVE5BSkFBQUFBQUE3dE5YbCtiMk9Nb3JuZmRkY0tNYTRZcHZlR3k4OW10ek4rZTJ1dXpxL21kYzlBd0FBQUFEQXV1UmY5UGRkazBlV2Zwc0RyaERDdVNPdTN2dlM4Y3U0amtzQXgrN3RqYkVYVlVjbkFBQUFBQUNNTExZcGQzYStOdGEyYXFQdE1lUjNzVTA1ZkR0UmtsSHN2S3RUMEFrQUFBQUFBQk1wWTIxejhQSlBZMjJydENsamJJV2RJNHB0K2hCQ09Lem1ocWVWdTlsZjdlb0tCSjBBQUFBQUFEQURzVTFONmZJVWVOWWw5VjF6WEhzUnhsVEdCbC9XYzhlVHkxMmRWN3U0Q0RzNkFRQUFBQUJnQnZxdVNXV1A1M0VaYTBvZG10aW1OODU2UEgzWDVFN2F0N1hjN3d5ODN0VWw2T2dFQUFBQUFJQVowdUZablJkOTE1elhYb1N4bExIUmwxNWZvOWxKVjZlT1RnQUFBQUFBbUNFZG50VTVLeU5WR1VIWmk3cXozWkg4eVU2Nk9uVjBBZ0FBQUFEQUF1andyRUlPdEorVkVJNFJ4RFo5Q09xTUw2b0FBQjIxU1VSQlZDRWNxdlVvQnUvcTFORUpBQUFBQUFBTG9NT3pDam5FZmw5N0VVWjJYTlhkVG12d3JrNUJKd0FBQUFBQUxFZ09QSFBYWHdqaGJRaEI1OS82SE1ZMm5kUmVoTEdVRHNPM2RkenQ1SnJZcGtFNzBnV2RBQUFBQUFDd01IbTBhZDgxYi9Jb3lCRENxZk5iblpleFRVZTFGMkZFcDdxa1J6Tm9WNmNkblFBQUFBQUFzSENsUytyTXJzRlZ5ZDI2ei91dTJkUmVpREdVWU5uWTRIRU10cXRUUnljQUFBQUFBQ3hjRGczNnJubWVnekdkYWF1eGw4UHIyS2E5MmdzeGhyNXJ6a01JRit1LzAxa1lyS3RUMEFrQUFBQUFBQ3ZSZDgxRjN6WGYydCs1R2djaEJQczZ4M05jeTQxT2JMQmRuWUpPQUFBQUFBQlltYksvODFrSTRkelpMbDRPaFY3V1hvUXhsSEdxZHQ2T1k1Q3VUanM2QVFBQUFBQmd4V0tiRHN2K3prRTZxSmpNTS9zNmQ2K01DdjVVUmdlelcwL2UxYW1qRXdBQUFBQUFWaXlQc3kzZG5XK2Q4Nks5dDY5ejkvcXV1ZlphR2MyVHV6cDFkQUlBQUFBQVFDVmltdzVLZCtlQk0xK2s4NzVyWHRSZWhESEVObjNTQlQyS0ozVjE2dWdFQUFBQUFJQks1TkduZmRmbzdseXVJL3M2UjNOY3lYMU83VWxkblRvNkFRQUFBQUNnUXJvN0Y4Mit6aEhFTm4wSUlSeXUva2FuOStpdVRoMmRBQUFBQUFCUUlkMmRpM1ptWCtjb2RIV080OUZkbllKT0FBQUFBQUNvV044MWIzS0hZQWhCaCtCeTVDN2NrOXFMc0d1bHl6Q3QreTVub1hsc2NDL29CQUFBQUFDQXltMTFkNTdXWG9zRnllSFFVZTFGR0VIdWVMNWUvVjFPNzFHN1orM29CQUFBQUFBQWZoUGJsSGNTdmc4aEdJMDZmOWRsWCtlajlodHlQN0ZOYjU0eVhwVjd1UzY3T2g4VUt1dm9CQUFBQUFBQWZ0TjN6VVVPSEVJSTU2b3llem1NUHF1OUNDTTQxZFc1YzN1UDZlb1VkQUlBQUFBQUFIK1F1NnI2cm5rUlFuaWxNck4zR052MHFMR2YzRS9wTW55clhEdjMvVU1md09oYUFBQUFBQURnczJLYkRzb28yMzFWbXJVOHduWlRleEYyS2JicGs5ZkJ6aDMzWFpQdSt5QTZPZ0VBQUFBQWdNOHE0ZGt6bzJ4bnp3amIzZFBWdVhzUDJvV3FveE1BQUFBQUFMaVhNaUwxUkxWbTYyM2ZOVzlxTDhJdXhUWmRoaEFPMW51SHMzRHZyazRkblFBQUFBQUF3TDMwWFhNYVFuZ2VRcmhXc1ZsNkhkdDBXSHNSZHN6ZTJ0Mjc5NjVPSFowQUFBQUFBTUNEeERidGhSQSs2R3licGF1eXIxTVl2U094VGZtNUwxRGVyZWQ5MTF4ODdSRjBkQUlBQUFBQUFBK1NRN1MrYS9MZXpudU5sMlJVK3cvZGM4aUQyZFc1ZS9kNkR1dm9CQUFBQUFBQUhzM2V6dG02VjBjY2o2T3JjeFRmOWwxejlhVUgwdEVKQUFBQUFBQThtcjJkczNWV1JneXpHN282ZCsrclhaMkNUZ0FBQUFBQTRFbEs1MkFPT3pjcU9SdDVoTzNMMm91d0srVTVyMk4ydDVxdmhmV0NUZ0FBQUFBQTRNbjZydGtJTzJmbmRXelRRZTFGMkNGZG5idjN4YkRlams0QUFBQUFBR0JRc1UxbnVSdExWV2RoMDNmTnM5cUxzQ3QyZGU3Y2RkblZlZWRvYkIyZEFBQUFBQURBb1BxdU9RNGhuS3JxTEJ6RU5yMnB2UWc3cEt0enQvTG8ycVBQUFlLZ0V3QUFBQUFBR0Z6Zk5hOUNDTWNxT3d0NWhPMSs3VVhZQmJzNlIvSDZjdzhpNkFRQUFBQUFBSGFpNzVwVXdzNDd4MDR5cWpQbDNobGRuYnUxSDl0MDUzaGdRU2NBQUFBQUFMQXpKZXg4THV5YzNHRnNrNzJwTzZDcmN4UjNkblVLT2dFQUFBQUFnSjNxdTJZajdKeUZrOWltdmRxTHNDTzZPbmZyOEs3eHk0Sk9BQUFBQUFCZzU3YkN6aXZWbmt3T09VOHF2ZmVkMHRVNWlqOTFkUW82QVFBQUFBQ0FVWlN3ODFrSVlhUGlrMmsrdCsrUUo5UFZ1VnRIdHp1U0JaMEFBQUFBQU1CbytxNjVMcDJkd3M3cG5OVjY0N3VrcTNQbmNzajVoejJ6Z2s0QUFBQUFBR0JVd3M3SjdjYzJ2YW04QnJ2eWJwMjNOUnZmYjEvSVgrcXVCUUFBQUFBQU1KVXlodkpEQ09IQUlZd3VoODNQK3E2eE0zVmdzVTJmY3BpOHFwdWFseGQ5MTV3SEhaMEFBQUFBQU1CVWRIWk9Lb2ZNSnhYZi95N1oxYmxidjNWMTZ1Z0VBQUFBQUFBbXBiTnpVcy9MYmtrR3BLdHo1NzdOM2NnNk9nRUFBQUFBZ0VucDdKelVXY1gzdmtzL3JQZldadUhYcms0ZG5RQUFBQUFBd0N6bzdKek1xNzVyVGl1OTk1MG96K1ZQWlVRd3c4dHZqdmhXUnljQUFBQUFBREFMT2pzbjg3b0Vjd3lrUEplVGV1NU1mcjRlQ1RvQkFBQUFBSURaRUhaT0lvZEdKeFhlOTY2OVcvZnRUZTU3UVNjQUFBQUFBREFySmV3OEx1TXBHVWNUMjJSazhJRDZycm5TMWJsVFY0Sk9BQUFBQUFCZ2R2cXUyWlRPVG1IbmVIUjFEazlYNTdEeXo0VlhlVDluM3pVdi9yS21Pd01BQUFBQUFOYWxkQmwrS09OVjJiMFhmZGVjcS9Od1lwdnk4L2R3TGZjemdkd1ptNStUUDVRM1FQem1yN0ZOQ2d2QWxEWmxGQWtBRXltL05QQUxBK0J6L0gwTkFKaFVEalppbS9JWTIvZE9ZaFFuSlZSaU9EOElPaC9zdWp3UGYveFM4UDZYMktaZjVuc1BBRlRnZWQ4MUZ3NGFZRHJlV1FwOGhiK3ZBUUN6RU52VWhCRE9uTVlvWHZWZGMxckJmWTRtdHVsVENHRy9rdHQ5aWwvRHpmejVQbSs0dEtNVEFBQUFBQUNZdmI1clV0bk54KzY5am0weStXZFlQNnpwWmdiMmg3MmIrYlYrMzZreWYxM1NYUUlBQUFBQUFQWEtYWWF4VFg4UElUU2VCanVWUTg2WElZUTNLNzdIc2VVTzJkZDEzZklYZlhidjVrTUlPZ0hnRHJGTmVSZkJnZG9Bai9EcUtYOUJCMkE2L2c0STFmaWhkSVd0VWxsTHdIemwzZGM2RXArbzc1cmowbTE0dE9nYm1iL2MxWms3NjY1cUw4UVFjb2Rpcm1mbElmMjk5bTQraEtBVEFPNTJZRjhkOEVoRyt3QXNsNzhEUWgwK3J2d3UvUnlqRnNkbDM2RTNLZTNXNjFKcmh2R3UwcUR6UVhzM0g4S09UZ0FBQUFBQVlGRktXUEs4ZElpeE8wMXMwNzc2RHFOTWdLcGxDdFNqOTI0K2hJNU9BQUFBQUFCZ2Njb28wQngyZmpCZFo2Zk9TcWpNTU42Vm1xN1JJSHMzSDBKSEp3QUFBQUFBc0VnbFRMSDNkTGNPWTV1TXhSN08rY282a2ZPOTVOMmp1V3N6ZDIrK0dpdmtESUpPQUFBQUFBQmd5ZkpJekJEQ1c0ZTRVNjlYZkcrakt1TmIwd3B1NWJ6c2I4M2g1bkhmTmVkVFhJU2dFNENwWFRrQkFBQUFBSjZpNzVvM0pYaGhOM1IxRHV2ZFFxOTdsTDJiRDJGSEp3Q1Q2cnRHMEFrQUFBREFFSEozMlg0STRVQTFkeUx2bGZ4MmhmYzF1dnc3MGRpbXpVS2VxNlB2M1h3SUhaMEFBQUFBQU1EaWxjNnk0NVh0UDV5VC9kaW1wdllpREdqT1haMlQ3dDE4Q0VFbkFBQUFBQUN3Q2lXTU9YYWFPMk5YNTNET1p4akt6Mkx2NWtNSU9nRUFBQUFBZ05VbzRjeGJKN29UdWpvSFVqcVE1eEFrem03djVrUFkwUWtBQUFBQUFLeEszelZ2WXB1K0N5RWNPdG5CdlM1alRYbTZIMElJVXdUSHM5NjcrUkE2T2dFQUFBQUFnRFY2VVFJZGhxV3JjeUI5MTF5TStCeGR6TjdOaHhCMEFnQUFBQUFBcTFQR2I3NXdzanRoVitkd2Z0ang5MS9jM3MySEVIUUNBQUFBQUFDclZEcldYam5kd2VucUhNNHV4Z0F2ZXUvbVF3ZzZBUUFBQUFDQTFlcTc1clIwdFRFc1haMEQ2THZtcWdTVFQ1Vy9UMzZ1UCt1N0puK2NsdSs5YW45ZCt3MENBQUFBQUFEVnk2TTdEME1JZTdVWFlrQy9kblhtYnNIVjNORjAzb1VRemg3eDZOY2x4UDl4YlNOcDcwdEhKd0FBQUFBQXNHcjJkZTZNcnM1aFBEU2tYUFhlelljUWRBSUFBQUFBQUt2WGQ4MUZDT0d0a3g2VVhaMERLRUg4MThMS2F2WnVQb1RSdFFBQUFBQUFRQlg2cm5rVDIvU1BFTUtCRXg5TTd1bzB2dmJwZmd3aEhOMzZMbGNsQVAyaDc1b2g5bml1anFBVEFBQUFBQUNvU1I1aGUybGY1MkJ5VitkUnplTlRCM0plOW5SV3YzZnpJWXl1QlFBQUFBQUFxdEYzelpVUnRvUDdmbVgzTTdveWh2YTV2WnNQSStnRUFBQUFBQUNxMG5mTjZUMTJJbkovaDdGTmgrcjFOSG1QckwyYkR5UG9CQUFBQUFBQWFuUmN4b1F5ak5mcXlOZ0VuUUFBQUFBQVFIVks1OXl4a3grTXJrNUdKK2dFQUFBQUFBQ3FWUFlnR21FN25IK3U1VVpZQmtFbkFBQUFBQUJRTXlOc2g5UEVOdTJ2NVdhWXZ4eDBicHdUQUFBQUFBQlFJeU5zQjJkWEo2UDV4cnNVQUFBQUFBQ0FtaGxoTzZqYzFibTNvdnRoeG95dUJRQUFBQUFBTU1KMlNDL1hjeXZNbWFBVEFBQUFBQUNvWGhsaCs3YjJPZ3prKzFYY0JiTW42QVFBQUFBQUFQaDMySGthUXJoUWl5ZmJpMjFxRm40UExJQ2dFd0FBQUFBQTRIZXYxR0lRcjFkd0Q4eWNvQk1BQUFBQUFLRG91MlpqaE8wZzltT2JEbGR3SDh5WW9CTUFBQUFBQU9DUDhnamJLelY1TWwyZDdKU2dFd0FBQUFBQVlFdmZOZGRHMkE3aU1MWnBmd1gzd1V3Sk9nR1kwclhxQXdBQUFEQkhmZGVjaHhBdUhNNlQ2ZXBrWndTZEFFeHBvL29BQUFBQXpOaXh3M215bzlpbXZZWGZBek1sNkFRQUFBQUFBTGhEM3pWNVQrZGJ0WG1TSEhJMkM3NStaa3pRQ1FBQUFBQUE4SG1uSVlRcjlYbVM3eGQ4N2N5WW9CTUFBQUFBQU9BeitxNjUxdFg1WlB1eFRVY0x2d2RtU05BSkFBQUFBQUR3QlgzWHBCRENoUm85aWE1T0JpZm9CQUFBQUFBQStEcGRuVTl6R051MHYrUWJZSDRFblFBQUFBQUFBRi9SZDAzdTZFenE5Q1M2T2htVW9CTUFBQUFBQU9CK2RIVStUUlBidExma0cyQmVCSjBBQUFBQUFBRDMwSGZOVlFqaFZLMGVMWWVjUnd1OWRtWkkwQWtBQUFBQUFIQi91YXZ6V3IwZXpmaGFCaVBvQkFBQUFBQUF1S2UrYTNMSStVNjlIdTBndHVsZ29kZk96QWc2QVFBQUFBQUFIdVpVVitlVDZPcGtFSUpPQUFBQUFBQ0FCOURWK1dpNWJpbUU4T05DcjUrWithc0RBUUFBQUFBQWVKaSthOTdFTnYwemhMQ3ZkRjkwRlVJNHorRm0zelVYTTc1T0ZralFDUUFBQUFBQThEaHZRd2huYXZjbkY2VnI4N3p2bXF1WlhSc3JJdWdFQUFBQUFBQjRoTDVyVW16VGExMmR2NDZrelYyYkgwdTRhWDhwb3hCMEFnQUFBQUFBUEY2dFhaMUcwakk1UVNjQUFBQUFBTUFqVmRiVmFTUXRzeUxvQkFBQUFBQUFlSnAzSVlTVEZkYlFTRnBtVGRBSkFBQUFBQUR3TkNtRWtMczY5MVpRUnlOcFdZeS9saWNzQUFBQUFBQUFqNUE3SFdPYjNwV3djNG1NcEdXUmN0RDVMMGNIQUFBQUFBRHdKS2NoaE84WDB0VnBKQzJyWUhRdEFBQUFBQURBRTVXdXpqekM5dVZNYTJra0xhc2o2QVFBQUFBQUFCakd1NWtGblViU3NtcUNUZ0FBQUFBQWdBSGtNTEYwZFRZVDFkTklXcW9pNkFRQUFBQUFBQmpPRHlNSG5VYlNVaTFCSndBQUFBQUF3RUJ5MkJqYnRBa2hIT3l3cGtiU1VyMGc2QVFBQUFBQUFCaGMzdFY1TnVBM05aSVc3aURvQkFBQUFBQUFHRkRmTlNtMjZTU0VzUGVFNzJva0xYeUZvQk1BQUFBQUFHQjRLWVR3OG9IZjFVaGFlQUJCSndCVCtxajZBQUFBQUt6VXUzc0VuVWJTd2hNSU9nRUFBQUFBQUFhV096SmptM0tINXVHdDcyd2tMUXhFMEFrQUFBQUFBTEFiUDVTZzAwaGEyQUZCSndBQUFBQUF3RzZjRzBrTHV5UG9CQUFBQUFBQTJBRUJKK3pXTitvTEFBQUFBQUFBTEkyZ0V3QUFBQUFBQUZnY1FTY0FBQUFBQUFDd09JSk9BQUFBQUFBQVlIRUVuUUFBQUFBQUFNRGlDRG9CQUFBQUFBQ0F4UkYwQWdBQUFBQUFBSXNqNkFRQUFBQUFBQUFXUjlBSkFBQUFBQUFBTEk2Z0V3QUFBQUFBQUZnY1FTY0FBQUFBQUFDd09JSk9BQUFBQUFBQVlIRUVuUUFBQUFBQUFNRGlDRG9CQUFBQUFBQ0F4UkYwQWdBQUFBQUFBSXVUZzg1cnh3WUFBQUFBQUFBc1NRNDZOMDRNQUFBQUFBQUFXQktqYXdFQUFBQUFBSURGRVhRQ0FBQUFBQUFBaXlQb0JBQUFBQUFBQUJaSDBBa0FBQUFBQUFBc2pxQVRBQUFBQUFBQVdCeEJKd0FBQUFBQUFMQTRnazRBQUFBQUFBQmdjUVNkQUFBQUFBQUF3T0lJT2dHWTBrYjFBUUFBQUFCNERFRW5BRk82Vm4wQUFBQUFBQjVEMEFrQUFBQUFBQUFzanFBVEFBQUFBQUFBV0J4Qkp3QUFBQUFBQUxBNGdrNEFBQUFBQUFCZ2NRU2RBQUFBQVBELzI3dWowMGJPS0FDalNsQUxmazRyZGljRExtVHRRZ2EwbFZqcFFOdUIzdWRGVzBHQ0F3N0dzSUZJc21jK3pUa1ZEUGRLOG5nKzlBc0FnQnloRXdBQUFBQUFBTWpaV2xuT3d6UU8rK3JGM3ozdTdqZWJ6Y3NDTG9WZmU1N0c0YWs4bjd2SDNWOEx1QXpnazAzajhOc2FaM3ozdUh2OWpQNjJnRXNCQVBoeWE3MEhoUC9EK3dTQU5mR05UZ0FBQUFBQUFDQkg2QVFBQUFBQUFBQnloRTRBQUFBQUFBQWdSK2dFQUFBQUFBQUFjclpXQmdBQWtQWmdmWHl5Z3dFREFBQkxKSFFDQUFDRVRlT3d0ejhBQUFEV3lORzFBQUFBQUFBQVFJN1FDUUFBQUFBQUFPUUluUUFBQUFBQUFFQ08wQWtBQUFBQUFBRGtDSjBBQUFBQUFBQkFqdEFKQUFBQUFBQUE1THlHem9PMUFRQUFBQUFBQUNXL1QrTndzakVBQUFBQUFBQ2d4TkcxQUFBQUFBQUFRSTdRQ1FBQUFBQUFBT1FJblFBQUFBQUFBRUNPMEFrQUFBQUFBQURrQ0owQUFBQUFBQUJBanRBSkFBQUFBQUFBNUFpZEFBQUFBQUFBUUk3UUNjQ2NUcVlQQUFBQUFNQTVoRTRBWmpPTnc4SDBBUUFBQUFBNGg5QUpBQUFBQUFBQTVBaWRBQUFBQUFBQVFJN1FDUUFBQUFBQUFPUUluUUFBQUFBQUFFQ08wQWtBQUFBQUFBRGtDSjBBQUFBQUFBQkFqdEFKQUFBQUFBQUE1QWlkQUFBQUFBQUFRSTdRQ1FBQUFBQUFBT1FJblFBQUFBQUFBRUNPMEFrQUFBQUFBQURrQ0owQUFBQUFBQUJBanRBSkFBQUFBQUFBNUFpZEFBQUFBQUFBUUk3UUNRQUFBQUFBQU9RSW5RQUFBQUFBQUVDTzBBa0FBQUFBQUFEa0NKMEFBQUFBQUFCQWp0QUpBQUFBQUFBQTVMeUZ6cVBWQVFBQUFBQUFBQlZDSndBQUFBQUFBSkRqNkZvQUFBQUFBQUFnUitnRUFBQUFBQUFBY29ST0FBQUFBQUFBSUdkclpRQUFBQUFVM0QzdW5peUtLOWhQNDdDLzFVRjZueXplY1JxSDNkcUhBSEF0UWljQUFBQUFGZDlzaWl1NTJkRHBmYko0cjY4OW9SUGdTaHhkQ3dBQUFBQUFBT1FJblFBQUFBQUFBRUNPMEFrQUFBQUFBQURrQ0owQXpPV1dmdzhGQUFBQUFJQlB0alZnQUFDQXJydkgzYjMxOGNrTzB6aWNEQmtBQUZnYW9STUFBS0R0eGY3NFpBOU80d0FBQUpiSTBiVUFBQUFBQUFCQWp0QUpBQUFBQUFBQTVBaWRBQUFBQUFBQVFJN1FDUUFBQUFBQUFPUUluUUFBQUFBQUFFQ08wQWtBQUFBQUFBRGtDSjBBQUFBQUFBQkFqdEFKQUFBQUFBQUE1QWlkQUFBQUFBQUFRSTdRQ1FBQUFBQUFBT1FJblFBQUFBQUFBRUNPMEFrQUFBQUFBQURrQ0owQUFBQUFBQUJBanRBSkFBQUFBQUFBNUFpZEFBQUFBQUFBUUk3UUNRQUFBQUFBQU9RSW5RQUFBQUFBQUVET1crZzhXUjBBQUFBQUFBQlE4Ulk2ZjlnWUFBQUFBQUFBVU9Ib1dnQUFBQUFBQUNCSDZBUUFBQUFBQUFCeWhFNEFBQUFBQUFBZ1IrZ0VBQUFBQUFBQWNvUk9BQUFBQUFBQUlFZm9CQUFBQUFBQUFIS0VUZ0FBQUFBQUFDQkg2QVFBQUFBQUFBQnloRTRBNW5Jd2VRQUFBQUFBemlWMEFqQ1hueVlQQUFBQUFNQzVoRTRBQUFBQUFBQWdSK2dFQUFBQUFBQUFjb1JPQUFBQUFBQUFJRWZvQkFBQUFBQUFBSEtFVGdBQUFBQUFBQ0JINkFRQUFBQUFBQUJ5aEU0QUFBQUFBQUFnUitnRUFBQUFBQUFBY29ST0FBQUFBQUFBSUVmb0JBQUFBQUFBQUhLRVRnQUFBQUFBQUNCSDZBUUFBQUFBQUFCeWhFNEFBQUFBQUFBZ1IrZ0VBQUFBQUFBQWNvUk9BQUFBQUFBQUlFZm9CQUFBQUFBQUFIS0VUZ0FBQUFBQUFDQkg2QVFBQUFBQUFBQnloRTRBQUFBQUFBQWc1eTEwN3EwT0FBQUFBQUFBcVBDTlRnQUFBQUFBQUNCSDZBUUFBQUFBQUFCeWhFNEFBQUFBQUFBZ1IrZ0VBQUFBQUFBQWNvUk9BQUFBQUFBQUlFZm9CQUFBQUFBQUFIS0VUZ0FBQUFBQUFDQkg2QVFBQUFBQUFBQnloRTRBNW5JMGVRQUFBQUFBemlWMEFqQVhvUk1BQUFBQWdMTUpuUUFBQUFBQUFFQ08wQWtBQUFBQUFBRGtDSjBBQUFBQUFBQkFqdEFKQUFBQUFBQUE1QWlkQUFBQUFBQUFRSTdRQ1FBQUFBQUFBT1FJblFBQUFBQUFBRUNPMEFrQUFBQUFBQURrQ0owQUFBQUFBQUJBanRBSkFBQUFBQUFBNUFpZEFBQUFBQUFBUUk3UUNRQUFBQUFBQU9RSW5RQUFBQUFBQUVDTzBBa0FBQUFBQUFEa0NKMEFBQUFBQUFCQWp0QUpBQUFBQUFBQTVBaWRBQUFBQUFBQVFJN1FDUUFBQUFBQUFPUUluUUFBQUFBQUFFRE9XK2c4V0IwQUFBQUFBQUJROFUvb25NYmhaR01BQUFBQUFBQkFoYU5yQVFBQUFBQUFnQnloRXdBQUFBQUFBTWdST2dFQUFBQUFBSUFjb1JNQUFBQUFBQURJRVRvQkFBQUFBQUNBSEtFVEFBQUFBQUFBeUJFNkFRQUFBQUFBZ0J5aEU0QzVuRXdlQUFBQUFJQnpDWjBBekdJYWg0UEpBd0FBQUFCd0xxRVRBQUFBQUFBQXlCRTZBUUFBQUFBQWdCeWhFd0FBQUFBQUFNZ1JPZ0VBQUFBQUFJQWNvUk1BQUFBQUFBRElFVG9CQUFBQUFBQ0FIS0VUQUFBQUFBQUF5QkU2QVFBQUFBQUFnQnloRXdBQUFBQUFBTWdST2dFQUFBQUFBSUFjb1JNQUFBQUFBQURJRVRvQkFBQUFBQUNBSEtFVEFBQUFBQUFBeUJFNkFRQUFBQUFBZ0J5aEV3QUFBQUFBQU1qWldoa0FBQUFBRVE4V3hSVWNEUkVBYm9QUUNRQUEwT2FoUDUvdFlNSXN4VFFPZThzQUFPQ04wQWtBQUJEbW9UOEFBQUJyNVRjNkFRQUFBQUFBZ0p6M29kUFo5QUFBQUFBQUFFQ0MwQWtBQUFBQUFBRGtPTG9XQUFBQUFBQUF5QkU2QVFBQUFBQUFnQnloRXdBQUFBQUFBTWdST2dFQUFBQUFBSUFjb1JNQUFBQUFBQURJRVRvQkFBQUFBQUNBSEtFVEFBQUFBQUFBeUJFNkFRQUFBQUFBZ0J5aEU0QTU3RTBkQUFBQUFJQkxDSjBBQUFBQUFBQkFqdEFKQUFBQUFBQUE1QWlkQUFBQUFBQUFRSTdRQ1FBQUFBQUFBT1FJblFBQUFBQUFBRUNPMEFrQUFBQUFBQURrQ0owQUFBQUFBQUJBanRBSkFBQUFBQUFBNUFpZEFBQUFBQUFBUUk3UUNRQUFBQUFBQU9RSW5RQUFBQUFBQUVDTzBBa0FBQUFBQUFEa0NKMEFBQUFBQUFCQWp0QUpBQUFBQUFBQTVBaWRBQUFBQUFBQVFJN1FDUUFBQUFBQUFPUUluUUFBQUFBQUFFQ08wQWtBQUFBQUFBRGtDSjBBQUFBQUFBQkF6dnZRZWJJK0FBQUFBQUFBb09COTZQeGhZd0FBQUFBQUFFQ0JvMnNCQUFBQUFBQ0FIS0VUQUFBQUFBQUF5QkU2QVFBQUFBQUFnQnloRXdBQUFBQUFBTWdST2dFQUFBQUFBSUFjb1JNQUFBQUFBQURJRVRvQkFBQUFBQUNBSEtFVEFBQUFBQUFBeUJFNkFaakR3ZFFCQUFBQUFMaUUwQW5BSEg2YU9nQUFBQUFBbHhBNkFRQUFBQUFBZ0J5aEV3QUFBQUFBQU1qWldoa0FVSFQzdUx0ZjZlTCtXTUExQUFETVlzWDNnRnpYY1JxSG81a0NRSi9RQ1FCVXZkZ2NBTURxdUFma0dwNDNtODJUU1FKQW42TnJBUUFBQUFBQWdCeWhFd0FBQUFBQUFNZ1JPZ0VBQUFBQUFJQWNvUk1BQUFBQUFBRElFVG9CQUFBQUFBQ0FIS0VUQUFBQUFBQUF5QkU2QVFBQUFBQUFnQnloRXdBQUFBQUFBTWdST2dFQUFBQUFBSUFjb1JNQUFBQUFBQURJRVRvQkFBQUFBQUNBSEtFVEFBQUFBQUFBeUJFNkFRQUFBQUFBZ0J5aEV3QUFBQUFBQU1nUk9nRUFBQUFBQUlDYzk2RnpiMzBBQUFBQUFBQkFnVzkwQWdBQUFBQUFBRGxDSndBQUFBQUFBSkFqZEFJQUFBQUFBQUE1UWljQUFBQUFBQUNRSTNRQ0FBQUFBQUFBT1VJbkFBQUFBQUFBa0NOMEFnQUFBQUFBQURsQ0p3QUFBQUFBQUpBamRBSXdoNU9wQXdBQUFBQndDYUVUZ0RrY1RCMEFBQUFBZ0VzSW5RQUFBQUFBQUVDTzBBa0FBQUFBQUFEa0NKMEFBQUFBQUFCQWp0QUpBQUFBQUFBQTVBaWRBQUFBQUFBQVFJN1FDUUFBQUFBQUFPUUluUUFBQUFBQUFFQ08wQWtBQUFBQUFBRGtDSjBBQUFBQUFBQkFqdEFKQUFBQUFBQUE1QWlkQUFBQUFBQUFRSTdRQ1FBQUFBQUFBT1FJblFBQUFBQUFBRUNPMEFrQUFBQUFBQURrQ0owQUFBQUFBQUJBanRBSkFBQUFBQUFBNUFpZEFBQUFBQUFBUUk3UUNRQUFBQUFBQU9RSW5RQUFBQUFBQUVETys5QjV0RDRBQUFBQUFBQ2c0Ti9RT1kyRDBBa0FBQUFBQUFBa09Mb1dBQUFBQUFBQXlCRTZBUUFBQUFBQWdCeWhFd0FBQUFBQUFNZ1JPZ0VBQUFBQUFJQWNvUk1BQUFBQUFBRElFVG9CQUFBQUFBQ0FIS0VUQUFBQUFBQUF5QkU2QVFBQUFBQUFnQnloRTRBdk40M0QzdFFCQUFBQUFMaUUwQWtBQUFBQUFBRGtDSjBBQUFBQUFBQkFqdEFKQUFBQUFBQUE1QWlkQUFBQUFBQUFRSTdRQ1FBQUFBQUFBT1FJblFBQUFBQUFBRUNPMEFrQUFBQUFBQURrQ0owQUFBQUFBQUJBanRBSkFBQUFBQUFBNUFpZEFBQUFBQUFBUUk3UUNRQUFBQUFBQU9RSW5RQUFBQUFBQUVDTzBBa0FBQUFBQUFEa0NKMEFBQUFBQUFCQWp0QUpBQUFBQUFBQTVBaWRBQUFBQUFBQVFJN1FDUUFBQUFBQUFPUUluUUFBQUFBQUFFQ08wQWtBQUFBQUFBRGtmQXlkSnlzRUFBQUFBQUFBbHU1ajZEellHQUFBQUFBQUFMQjBqcTRGQUFBQUFBQUFjb1JPQUFBQUFBQUFJRWZvQkFBQUFBQUFBSEtFVGdBQUFBQUFBQ0JINkFRQUFBQUFBQUJ5aEU0QUFBQUFBQUFnUitnRUFBQUFBQUFBY29ST0FBQUFBQUFBSUVmb0JPQ3JIVXdjQUFBQUFJQkxDWjBBZkxXVGlRTUFBQUFBY0NtaEV3QUFBQUFBQU1nUk9nRUFBQUFBQUlBY29STUFBQUFBQUFESUVUb0JBQUFBQUFDQUhLRVRBQUFBQUFBQXlCRTZBUUFBQUFBQWdCeWhFd0FBQUFBQUFNZ1JPZ0VBQUFBQUFJQWNvUk1BQUFBQUFBRElFVG9CQUFBQUFBQ0FIS0VUQUFBQUFBQUF5QkU2QVFBQUFBQUFnQnloRXdBQUFBQUFBTWpaV2hrQUFLemJOQTRQYTU4QkFBQUEwT01iblFBQUFBQUFBRUNPMEFrQUFBQUFBQURrZkR5Njl2dG1zL25UR2hmdGVBUFgvN3lBNitEWDlqY3dHNit4WmF0OGp2bWJDSnlyZnI4R3NHYnVBV0VkYnVIWngzL3hYR1RaL0w4QWNDMmJ6ZVp2MzYwc0x3MEhWdmNBQUFBQVNVVk9SSzVDWUlJPSIvPgo8L3N2Zz4=";
    return `data:image/svg+xml;base64,${base64}`;
  }

  _renderPages() {
    return Object.entries(this._pages)
      .map(([pageKey, cards]) => {
        const pageCards = pageKey === "media"
          ? this._renderMediaPage(cards)
          : pageKey === "home"
            ? this._renderHomePage(cards)
            : cards.map((card) => this._renderCard(card, pageKey)).join("");
        const activeClass = pageKey === this._page ? "page active" : "page";
        return `<div class="${activeClass}" data-page="${pageKey}">${pageCards}</div>`;
      })
      .join("");
  }

  _renderMediaPage(cards) {
    const pageCards = cards.map((card) => this._renderCard(card, "media")).join("");
    const hiddenButtons = this._collectCollapsedButtons(cards);
    const collapsedSection = hiddenButtons.length
      ? `
        <details class="collapse-panel">
          <summary>\u66f4\u591a\u63a7\u5236</summary>
          <div class="collapse-content">
            <div class="${this._resolveGridClass(hiddenButtons.length)}">${this._renderButtons(hiddenButtons)}</div>
          </div>
        </details>
      `
      : "";

    return `${pageCards}${collapsedSection}`;
  }

  _renderHomePage(cards) {
    const pageCards = cards.map((card) => this._renderCard(card, "home")).join("");
    const hiddenButtons = this._getHomeCollapsedButtons();
    const collapsedSection = hiddenButtons.length
      ? `
        <details class="collapse-panel">
          <summary>\u7a97\u5e18\u63a7\u5236</summary>
          <div class="collapse-content">
            <div class="${this._resolveGridClass(hiddenButtons.length, "grid-3")}">${this._renderButtons(hiddenButtons)}</div>
          </div>
        </details>
      `
      : "";

    return `${pageCards}${collapsedSection}`;
  }

  _renderCard(card, pageKey = "") {
    if (card?.acPanel) {
      return this._renderAcCard(card);
    }

    if (card?.mediaPanel) {
      return this._renderMediaActionCard(card);
    }

    const visibleTopButtons = this._getDisplayButtons(this._filterVisibleButtons(card.topButtons), pageKey);
    const mutedActions = this._extractMuteButtons(card);

    const topButtons = visibleTopButtons.length
      ? `<div class="${this._resolveGridClass(visibleTopButtons.length)}" style="margin-bottom: 20px;">${this._renderButtons(visibleTopButtons)}</div>`
      : "";

    const sideLeftButtons = this._resolveDpadSideButtons(card, "left");
    const sideRightButtons = this._resolveDpadSideButtons(card, "right");

    const dpad = card.dpad
      ? `
        <div class="d-pad-wrapper">
          <div class="d-pad-layout">
            <div class="d-pad-side">${this._renderButtons(sideLeftButtons, "side-btn")}</div>
            <div class="d-pad">
              <button class="d-btn d-up" data-command="${card.dpad.up[1]}">&#9650;</button>
              <button class="d-btn d-down" data-command="${card.dpad.down[1]}">&#9660;</button>
              <button class="d-btn d-left" data-command="${card.dpad.left[1]}">&#9664;</button>
              <button class="d-btn d-right" data-command="${card.dpad.right[1]}">&#9654;</button>
              <button class="d-btn d-ok" data-command="${card.dpad.ok[1]}">${card.dpad.ok[0]}</button>
            </div>
            <div class="d-pad-side">${this._renderButtons(sideRightButtons, "side-btn")}</div>
          </div>
        </div>
      `
      : "";

    const subtleActions = mutedActions.length
      ? `<div class="subtle-action-row">${this._renderButtons(mutedActions, "subtle-btn")}</div>`
      : "";

    const visibleBottomButtons = this._getDisplayButtons(card.bottomButtons, pageKey);
    const bottomButtons = visibleBottomButtons.length
      ? `<div class="${this._resolveGridClass(visibleBottomButtons.length)}" style="margin-top: 10px;">${this._renderButtons(visibleBottomButtons)}</div>`
      : "";

    const visibleFirstButtons = this._getDisplayButtons(this._filterCardButtons(card), pageKey);
    const firstGrid = card.grid && visibleFirstButtons.length
      ? `<div class="${this._resolveGridClass(visibleFirstButtons.length, card.grid)}"${card.secondGrid ? ' style="margin-bottom: 15px;"' : ""}>${this._renderButtons(visibleFirstButtons)}</div>`
      : "";

    const visibleSecondButtons = this._getDisplayButtons(this._filterVisibleButtons(card.secondButtons), pageKey);
    const secondGrid = card.secondGrid && visibleSecondButtons.length
      ? `<div class="${this._resolveGridClass(visibleSecondButtons.length, card.secondGrid)}">${this._renderButtons(visibleSecondButtons)}</div>`
      : "";

    return `
      <div class="card">
        <div class="card-title">${card.title}</div>
        ${topButtons}
        ${dpad}
        ${subtleActions}
        ${bottomButtons}
        ${firstGrid}
        ${secondGrid}
      </div>
    `;
  }

  _renderAcCard(card) {
    const acPanel = card.acPanel || {};
    const powerButtons = this._renderButtons(
      [[this._acPowerOn ? "\u5173\u95ed\u7a7a\u8c03" : "\u5f00\u542f\u7a7a\u8c03", "FE07C001160001", this._acPowerOn ? "danger" : "ac-power-off", "", { toggleAcPower: true }]],
      "ac-power-btn"
    );
    const modeButtons = this._renderButtons(this._getAcButtonsWithPowerState(acPanel.modes || []), "ac-mode-btn");
    const fanButtons = this._renderButtons(this._getAcButtonsWithPowerState(acPanel.fan || []), "ac-fan-btn");
    const acTempDial = this._renderAcTemperatureDial();

    return `
      <div class="card ac-card">
        <div class="card-title">${card.title}</div>
        <div class="ac-power-row">${powerButtons}</div>
        <div class="ac-section">
          <div class="ac-section-label">\u6a21\u5f0f</div>
          <div class="grid-3 ac-grid">${modeButtons}</div>
        </div>
        <div class="ac-section">
          <div class="ac-section-label">\u6e29\u5ea6</div>
          ${acTempDial}
        </div>
        <div class="ac-section">
          <div class="ac-section-label">\u98ce\u901f</div>
          <div class="grid-4 ac-grid">${fanButtons}</div>
        </div>
      </div>
    `;
  }

  _renderMediaActionCard(card) {
    const mediaPanel = card.mediaPanel || {};
    const navButtons = this._renderButtons(mediaPanel.nav || [], "media-nav-btn");
    const transportButtons = mediaPanel.transport || [];
    const playStackButtons = this._renderButtons(mediaPanel.playStack || [], "media-playback-btn media-icon-btn");
    const optionButtons = this._renderButtons(mediaPanel.options || [], "media-option-btn");
    const leftTransport = transportButtons[0] ? this._renderButtons([transportButtons[0]], "media-transport-btn media-icon-btn") : "";
    const rightTransport = transportButtons[1] ? this._renderButtons([transportButtons[1]], "media-transport-btn media-icon-btn") : "";

    return `
      <div class="card media-action-card">
        <div class="card-title">${card.title}</div>
        <div class="media-action-section">
          <div class="media-nav-grid">${navButtons}</div>
        </div>
        <div class="media-action-divider"></div>
        <div class="media-action-section">
          <div class="media-transport-layout">
            ${leftTransport}
            <div class="media-play-stack">${playStackButtons}</div>
            ${rightTransport}
          </div>
        </div>
        <div class="media-action-section">
          <div class="grid-3 media-option-grid">${optionButtons}</div>
        </div>
      </div>
    `;
  }

  _renderAcTemperatureDial() {
    const currentTemp = this._clampAcTemperature(this._acTemperature);
    const dialGeometry = this._getAcTempDialGeometry(currentTemp);
    const dialClass = this._acPowerOn ? "ac-temp-dial" : "ac-temp-dial disabled";
    const markers = [18, 22, 26, 30]
      .map((temp) => {
        const point = this._polarToCartesian(107, 107, 96, 225 + ((temp - 18) / 12) * 270);
        return `<text x="${point.x.toFixed(2)}" y="${(point.y + 4).toFixed(2)}" text-anchor="middle" font-size="12" fill="rgba(156,168,191,0.92)">${temp}</text>`;
      })
      .join("");

    return `
      <div class="ac-temp-dial-wrap">
        <div class="${dialClass}" data-ac-temp-dial="true">
          <svg class="ac-temp-svg" viewBox="0 0 214 214" aria-hidden="true">
            <defs>
              <linearGradient id="ac-temp-track" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="rgba(255,255,255,0.06)" />
                <stop offset="100%" stop-color="rgba(255,255,255,0.02)" />
              </linearGradient>
              <linearGradient id="ac-temp-progress" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#6ad8ff" />
                <stop offset="100%" stop-color="#8af0ff" />
              </linearGradient>
            </defs>
            <path d="${dialGeometry.trackPath}" fill="none" stroke="url(#ac-temp-track)" stroke-width="16" stroke-linecap="round"></path>
            <path id="ac-temp-progress-path" d="${dialGeometry.progressPath}" fill="none" stroke="url(#ac-temp-progress)" stroke-width="16" stroke-linecap="round"></path>
            ${markers}
            <circle id="ac-temp-thumb" cx="${dialGeometry.thumbPoint.x.toFixed(2)}" cy="${dialGeometry.thumbPoint.y.toFixed(2)}" r="10" fill="#8af0ff" stroke="rgba(255,255,255,0.9)" stroke-width="3"></circle>
          </svg>
          <div class="ac-temp-center">
            <div class="ac-temp-value" id="ac-temp-value">${currentTemp}<span class="ac-temp-degree">&deg;</span></div>
          </div>
        </div>
      </div>
    `;
  }

  _renderButtons(buttons, baseClass = "") {
    return buttons
      .map(([label, command, extraClass = "", icon = "", options = null]) => {
        const isLightToggle = Boolean(options?.toggleLight);
        const isAcPowerToggle = Boolean(options?.toggleAcPower);
        const toggleChannel = options?.toggleLight;
        const toggleActive = isLightToggle && this._isLightChannelOn(toggleChannel);
        const displayLabel = isLightToggle ? `${label}${toggleActive ? " \u5f00" : " \u5173"}` : label;
        const className = [
          baseClass,
          extraClass,
          toggleActive ? "light-toggle-active" : ""
        ].filter(Boolean).join(" ");
        const classes = className ? ` class="${className}"` : "";
        const renameAttr = this._isSceneRenameable(command) ? ` data-rename-command="${command}"` : "";
        const toggleAttr = isLightToggle ? ` data-light-toggle="${toggleChannel}"` : "";
        const acPowerAttr = isAcPowerToggle ? ` data-ac-power-toggle="true"` : "";
        const content = icon
          ? `<span class="button-content"><span class="button-icon">${icon}</span><span class="button-label">${displayLabel}</span></span>`
          : displayLabel;
        return `<button${classes} data-command="${command}"${renameAttr}${toggleAttr}${acPowerAttr}>${content}</button>`;
      })
      .join("");
  }

  _getAcButtonsWithPowerState(buttons = []) {
    if (this._acPowerOn) {
      return buttons;
    }

    return buttons.map(([label, command, extraClass = "", icon = "", options = null]) => [
      label,
      command,
      [extraClass, "ac-disabled-btn"].filter(Boolean).join(" "),
      icon,
      { ...(options || {}), disabledWhenAcOff: true }
    ]);
  }

  _getAcPowerStorageKey() {
    const mac = this._config?.mac || "default";
    return `mofei-remote-card.ac-power.${mac}`;
  }

  _getStoredAcPowerState() {
    try {
      const raw = window.localStorage.getItem(this._getAcPowerStorageKey());
      if (raw === null) {
        return true;
      }
      return raw === "true";
    } catch (error) {
      return true;
    }
  }

  _setStoredAcPowerState(isOn) {
    try {
      window.localStorage.setItem(this._getAcPowerStorageKey(), String(Boolean(isOn)));
    } catch (error) {
      // Ignore storage errors.
    }
  }

  _getLightChannelStorageKey() {
    const mac = this._config?.mac || "default";
    return `mofei-remote-card.light-channel-states.${mac}`;
  }

  _getStoredLightChannelStates() {
    try {
      const raw = window.localStorage.getItem(this._getLightChannelStorageKey());
      const parsed = raw ? JSON.parse(raw) : {};
      return typeof parsed === "object" && parsed ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  _setStoredLightChannelStates(states) {
    try {
      window.localStorage.setItem(this._getLightChannelStorageKey(), JSON.stringify(states || {}));
    } catch (error) {
      // Ignore storage errors.
    }
  }

  _isLightChannelOn(channel) {
    return this._lightChannelStates?.[String(channel)] === true;
  }

  _buildLightChannelCommand(channel, isOn) {
    const index = Number(channel) - 1;
    const channelHex = index.toString(16).toUpperCase().padStart(2, "0");
    return `FE05D1${channelHex}${isOn ? "01" : "00"}`;
  }

  _updateAcPowerUI() {
    const powerButton = this.shadowRoot?.querySelector("[data-ac-power-toggle]");
    if (powerButton) {
      powerButton.classList.toggle("danger", this._acPowerOn);
      powerButton.classList.toggle("ac-power-off", !this._acPowerOn);
      powerButton.textContent = this._acPowerOn ? "关闭空调" : "开启空调";
    }

    const dial = this.shadowRoot?.querySelector("[data-ac-temp-dial]");
    if (dial) {
      dial.classList.toggle("disabled", !this._acPowerOn);
    }
  }

  async _toggleAcPower() {
    this._acPowerOn = !this._acPowerOn;
    this._setStoredAcPowerState(this._acPowerOn);
    this._updateAcPowerUI();
    await this._sendCommand("FE07C001160001");
  }

  _updateLightToggleButtonsUI() {
    this.shadowRoot?.querySelectorAll("[data-light-toggle]").forEach((button) => {
      const channel = button.dataset.lightToggle;
      const active = this._isLightChannelOn(channel);
      button.classList.toggle("light-toggle-active", active);

      const nextLabel = `${channel}${active ? " 开" : " 关"}`;
      const labelNode = button.querySelector(".button-label");
      if (labelNode) {
        labelNode.innerHTML = nextLabel;
      } else {
        button.textContent = nextLabel;
      }
    });
  }

  async _toggleLightChannel(channel) {
    const channelKey = String(channel);
    const nextState = !this._isLightChannelOn(channel);
    this._lightChannelStates = {
      ...this._lightChannelStates,
      [channelKey]: nextState
    };
    this._setStoredLightChannelStates(this._lightChannelStates);
    this._updateLightToggleButtonsUI();
    await this._sendCommand(this._buildLightChannelCommand(channel, nextState));
  }

  _getStoredAcTemperature() {
    try {
      const raw = window.localStorage.getItem(this._getAcTemperatureStorageKey());
      return this._clampAcTemperature(Number(raw) || 22);
    } catch (error) {
      return 22;
    }
  }

  _setStoredAcTemperature(value) {
    try {
      window.localStorage.setItem(this._getAcTemperatureStorageKey(), String(this._clampAcTemperature(value)));
    } catch (error) {
      // Ignore storage errors.
    }
  }

  _getAcTemperatureStorageKey() {
    const mac = this._config?.mac || "default";
    return `mofei-remote-card.ac-temperature.${mac}`;
  }

  _clampAcTemperature(value) {
    return Math.min(30, Math.max(18, Math.round(Number(value) || 22)));
  }

  _buildAcTemperatureCommand(temperature) {
    const nextTemp = this._clampAcTemperature(temperature);
    return `FE07C001${nextTemp.toString(16).toUpperCase().padStart(2, "0")}0004`;
  }

  _getAcTempDialGeometry(temperature) {
    const startAngle = 225;
    const endAngle = 495;
    const progressAngle = startAngle + ((this._clampAcTemperature(temperature) - 18) / 12) * (endAngle - startAngle);

    return {
      trackPath: this._describeArcPath(107, 107, 78, startAngle, endAngle),
      progressPath: this._describeArcPath(107, 107, 78, startAngle, progressAngle),
      thumbPoint: this._polarToCartesian(107, 107, 78, progressAngle)
    };
  }

  _polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }

  _describeArcPath(centerX, centerY, radius, startAngle, endAngle) {
    const start = this._polarToCartesian(centerX, centerY, radius, endAngle);
    const end = this._polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x.toFixed(2), start.y.toFixed(2),
      "A", radius, radius, 0, largeArcFlag, 0, end.x.toFixed(2), end.y.toFixed(2)
    ].join(" ");
  }

  _eventToAcTemperature(event) {
    const dial = this.shadowRoot?.querySelector("[data-ac-temp-dial]");
    if (!dial) {
      return this._acTemperature;
    }

    const rect = dial.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI + 90 + 360) % 360;
    const adjustedAngle = angle < 225 ? angle + 360 : angle;
    const clampedAngle = Math.min(495, Math.max(225, adjustedAngle));
    const ratio = (clampedAngle - 225) / 270;
    return this._clampAcTemperature(18 + ratio * 12);
  }

  _startAcTemperatureDrag(event) {
    if (!this._acPowerOn) {
      return;
    }
    event.preventDefault();
    this._acTempDragging = true;
    const nextTemp = this._eventToAcTemperature(event);
    if (nextTemp !== this._acTemperature) {
      this._acTemperature = nextTemp;
      this._setStoredAcTemperature(this._acTemperature);
      this._updateAcTemperatureDialUI();
    }
    window.addEventListener("pointermove", this._boundAcTempPointerMove);
    window.addEventListener("pointerup", this._boundAcTempPointerUp);
  }

  _handleAcTempPointerMove(event) {
    if (!this._acTempDragging) {
      return;
    }

    const nextTemp = this._eventToAcTemperature(event);
    if (nextTemp === this._acTemperature) {
      return;
    }

    this._acTemperature = nextTemp;
    this._setStoredAcTemperature(this._acTemperature);
    this._updateAcTemperatureDialUI();
  }

  async _handleAcTempPointerUp() {
    if (!this._acTempDragging) {
      return;
    }

    this._acTempDragging = false;
    window.removeEventListener("pointermove", this._boundAcTempPointerMove);
    window.removeEventListener("pointerup", this._boundAcTempPointerUp);
    await this._sendCommand(this._buildAcTemperatureCommand(this._acTemperature));
  }

  _updateAcTemperatureDialUI() {
    const progressPath = this.shadowRoot?.getElementById("ac-temp-progress-path");
    const thumb = this.shadowRoot?.getElementById("ac-temp-thumb");
    const value = this.shadowRoot?.getElementById("ac-temp-value");
    if (!progressPath || !thumb || !value) {
      return;
    }

    const dialGeometry = this._getAcTempDialGeometry(this._acTemperature);
    progressPath.setAttribute("d", dialGeometry.progressPath);
    thumb.setAttribute("cx", dialGeometry.thumbPoint.x.toFixed(2));
    thumb.setAttribute("cy", dialGeometry.thumbPoint.y.toFixed(2));
    value.innerHTML = `${this._acTemperature}<span class="ac-temp-degree">&deg;</span>`;
  }

  _getIcon(name) {
    const icons = {
      playpause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7.2v9.6l7.6-4.8L8 7.2zm9.3-.2h-2v10h2v-10zM20 7h-2v10h2V7z"/></svg>',
      mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 7.8V5l-4.5 4H6v4h3.5L14 17v-2.8l-2.7-2.2L14 9.8zm4.7 1.5-1.4 1.4L19.6 13l-2.3 2.3 1.4 1.4 2.3-2.3 2.3 2.3 1.4-1.4-2.3-2.3 2.3-2.3-1.4-1.4-2.3 2.3-2.3-2.3z"/></svg>',
      replay: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5a7 7 0 0 1 6.6 4.7l1.9-.6A9 9 0 0 0 4.4 10H2l3.2 3.2L8.4 10H6.5A7 7 0 0 1 12 5zm6.8 5.8L15.6 14h1.9A7 7 0 0 1 12 19a7 7 0 0 1-6.6-4.7l-1.9.6A9 9 0 0 0 21.6 14H24l-3.2-3.2z"/></svg>',
      mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V22h2v-3.1A7 7 0 0 0 19 12h-2z"/></svg>',
      skip: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6.8v10.4L12.6 12 5 6.8zm8 0v10.4L20.6 12 13 6.8z"/></svg>',
      micplus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7a3 3 0 1 1 6 0v5a3 3 0 0 1-6 0V7zm8 5a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V22h2v-3.1A7 7 0 0 0 19 12h-2zm2-6V4h-2v2h-2v2h2v2h2V8h2V6h-2z"/></svg>',
      micminus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7a3 3 0 1 1 6 0v5a3 3 0 0 1-6 0V7zm8 5a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V22h2v-3.1A7 7 0 0 0 19 12h-2zm-1-5h6v2h-6V7z"/></svg>',
      volumeplus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5l-4.5 4H6v6h3.5L14 19V5zm3 5V8h2v2h2v2h-2v2h-2v-2h-2v-2h2z"/></svg>',
      volumeminus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5l-4.5 4H6v6h3.5L14 19V5zm1 5h6v2h-6v-2z"/></svg>',
      harmony: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 6a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm10 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM7 14c-2.2 0-4 1.3-4 3v1h8v-1c0-1.7-1.8-3-4-3zm10 2c0-.9-.5-1.7-1.3-2.2-.8.1-1.5.3-2.1.7.8.7 1.4 1.6 1.4 2.5v1H21v-1c0-1.3-1.8-2.5-4-2.5z"/></svg>',
      singer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3v9.6A3.5 3.5 0 1 1 13 9.4V5h6V3h-4zM6 13l2.4 2.4 1.4-1.4L7.4 11.6 6 13zm12 1-2.4 2.4 1.4 1.4 2.4-2.4L18 14z"/></svg>',
      cheer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h2v7H7V3zm8 2h2v5h-2V5zM4 12h4l2 9H6l-2-9zm10 0h4l-2 9h-4l2-9zm5-2 1.5 1.5L22 10l-1.5-1.5L19 10zM2 8.5 3.5 10 5 8.5 3.5 7 2 8.5z"/></svg>',
      boo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3h4l2 9H6L4 3zm10 0h4l-2 9h-4l2-9zm-1 11h7v2h-7v-2zm-9 0h7v2H4v-2zm2 4h12v2H6v-2z"/></svg>',
      funny: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-3 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-7 6h8a4 4 0 0 1-8 0z"/></svg>',
      prank: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 3 7v6c0 5 3.8 8.8 9 9 5.2-.2 9-4 9-9V7l-9-5zm-3 7h6v2H9V9zm0 4h6v2H9v-2z"/></svg>'
    };

    return icons[name] || "";
  }

  _filterCardButtons(card) {
    if (!card?.buttons) {
      return [];
    }

    const sideCommands = new Set(["FE04C708", "FE04C709", "FE04C702", "FE04C703"]);
    return card.buttons.filter(([, command]) => !sideCommands.has(command));
  }

  _filterVisibleButtons(buttons = []) {
    const hiddenCommands = new Set([
      "FE05C00101",
      "FE05C00100",
      "FE04C704",
      "FE04C714",
      "FE04C715",
      "FE05C10101",
      "FE05C10100",
      "FE05C20101",
      "FE05C20102",
      "FE05C20103",
      "FE05C20104",
      "FE04C717"
    ]);

    return buttons.filter(([, command]) => !hiddenCommands.has(command));
  }

  _getDisplayButtons(buttons = [], pageKey = "") {
    if (pageKey !== "scene") {
      return buttons || [];
    }

    return (buttons || []).map(([label, command, extraClass = ""]) => {
      const customLabel = this._getCustomSceneLabel(command);
      return [customLabel || label, command, extraClass];
    });
  }

  _isSceneRenameable(command) {
    return [
      "FE04D003",
      "FE04D000",
      "FE04D002",
      "FE04D001",
      "FE04D00D",
      "FE04D004"
    ].includes(command);
  }

  _getSceneLabelStorageKey() {
    const mac = this._config?.mac || "default";
    return `mofei-remote-card.scene-labels.${mac}`;
  }

  _getStoredSceneLabels() {
    try {
      const raw = window.localStorage.getItem(this._getSceneLabelStorageKey());
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  }

  _setStoredSceneLabel(command, label) {
    const labels = this._getStoredSceneLabels();
    const nextLabel = (label || "").trim();

    if (nextLabel) {
      labels[command] = nextLabel;
    } else {
      delete labels[command];
    }

    window.localStorage.setItem(this._getSceneLabelStorageKey(), JSON.stringify(labels));
  }

  _setConfigSceneLabel(command, label) {
    const nextLabels = { ...(this._config?.scene_labels || {}) };
    const nextLabel = (label || "").trim();

    if (nextLabel) {
      nextLabels[command] = nextLabel;
    } else {
      delete nextLabels[command];
    }

    this._config = {
      ...this._config,
      scene_labels: nextLabels
    };
  }

  _getCustomSceneLabel(command) {
    const syncedLabel = this._sceneLabels?.[command]?.trim();
    if (syncedLabel) {
      return syncedLabel;
    }

    const storedLabel = this._getStoredSceneLabels()[command]?.trim();
    if (storedLabel) {
      return storedLabel;
    }

    const configLabel = this._config?.scene_labels?.[command]?.trim();
    return configLabel || "";
  }

  async _ensureSceneLabelsLoaded() {
    const mac = this._config?.mac;
    if (!mac || !this._hass?.connection || this._sceneLabelsLoadedMac === mac) {
      return;
    }

    try {
      const result = await this._hass.connection.sendMessagePromise({
        type: "mofei_mqtt_bridge/get_scene_labels",
        mac
      });

      if (this._config?.mac !== mac) {
        return;
      }

      this._sceneLabels = result?.labels || {};
      this._sceneLabelsLoadedMac = mac;
      this._render();
    } catch (error) {
      console.warn("Failed to load scene labels from mofei_mqtt_bridge.", error);
      this._sceneLabelsLoadedMac = mac;
    }
  }

  _renderRenameDialog() {
    if (!this._renameDialog) {
      return "";
    }

    const syncHint = this._hass?.connection
      ? "\u5df2\u901a\u8fc7 Mofei Bridge \u540e\u7aef\u540c\u6b65"
      : "\u5f53\u524d\u65e0\u6cd5\u8fde\u63a5\u540e\u7aef\uff0c\u5c06\u56de\u9000\u4e3a\u672c\u6d4f\u89c8\u5668\u4fdd\u5b58";

    return `
      <div class="rename-modal">
        <div class="rename-modal-card">
          <div class="rename-modal-title">\u91cd\u547d\u540d\u573a\u666f</div>
          <div class="rename-modal-subtitle">\u957f\u6309\u573a\u666f\u6309\u94ae\u5373\u53ef\u5feb\u901f\u4fee\u6539\u540d\u79f0</div>
          <input
            id="rename-scene-input"
            class="rename-modal-input"
            maxlength="20"
            value="${this._escapeHtml(this._renameDialog.label || "")}"
            placeholder="\u8f93\u5165\u65b0\u7684\u663e\u793a\u540d\u79f0"
          />
          <div class="rename-modal-actions">
            <button class="rename-modal-secondary" id="rename-cancel">${this._renameDialog.saving ? "\u7b49\u5f85" : "\u53d6\u6d88"}</button>
            <button class="rename-modal-secondary" id="rename-reset">\u6062\u590d</button>
            <button class="rename-modal-accent" id="rename-save">${this._renameDialog.saving ? "\u4fdd\u5b58\u4e2d..." : "\u4fdd\u5b58"}</button>
          </div>
          <div class="rename-status${this._renameDialog.error ? " error" : ""}">${this._renameDialog.error || ""}</div>
          <div class="rename-sync-hint">${syncHint}</div>
        </div>
      </div>
    `;
  }

  _escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  _openRenameDialog(command) {
    this._renameDialog = {
      command,
      label: this._getCustomSceneLabel(command),
      saving: false,
      error: ""
    };
    this._render();
  }

  _closeRenameDialog() {
    this._renameDialog = null;
    this._render();
  }

  async _saveSceneLabel(command, label) {
    const nextLabel = (label || "").trim();
    this._setStoredSceneLabel(command, nextLabel);
    this._setConfigSceneLabel(command, nextLabel);

    if (this._hass?.connection && this._config?.mac) {
      try {
        const result = await this._hass.connection.sendMessagePromise({
          type: "mofei_mqtt_bridge/set_scene_label",
          mac: this._config.mac,
          command,
          label: nextLabel
        });

        const nextLabels = { ...this._sceneLabels };
        if (nextLabel) {
          nextLabels[command] = nextLabel;
        } else {
          delete nextLabels[command];
        }

        this._sceneLabels = result?.labels && Object.keys(result.labels).length ? result.labels : nextLabels;
        this._sceneLabelsLoadedMac = this._config.mac;
        return;
      } catch (error) {
        console.warn("Failed to sync scene label through mofei_mqtt_bridge, using local scene label.", error);
        return;
      }
    }
  }

  async _submitRenameDialog(mode = "save") {
    if (!this._renameDialog) {
      return;
    }

    const command = this._renameDialog.command;
    const input = this.shadowRoot?.getElementById("rename-scene-input");
    const nextLabel = mode === "reset" ? "" : (input?.value || "");

    this._renameDialog = {
      ...this._renameDialog,
      saving: true,
      error: "",
      label: nextLabel
    };
    this._render();
    const nextLabels = { ...this._sceneLabels };
    if (nextLabel.trim()) {
      nextLabels[command] = nextLabel.trim();
    } else {
      delete nextLabels[command];
    }

    this._sceneLabels = nextLabels;
    this._setConfigSceneLabel(command, nextLabel);
    this._sceneLabelsLoadedMac = this._config?.mac || null;
    this._renameDialog = null;
    this._render();
    await this._saveSceneLabel(command, nextLabel);
  }

  _extractMuteButtons(card) {
    const subtleCommands = new Set([]);
    return (card.topButtons || []).filter(([, command]) => subtleCommands.has(command));
  }

  _collectCollapsedButtons(cards) {
    return cards.flatMap((card) => {
      if (card?.mediaPanel?.hidden) {
        return card.mediaPanel.hidden;
      }

      const hiddenCommands = new Set([
        "FE05C00101",
        "FE05C00100",
        "FE05C10101",
        "FE05C10100",
        "FE05C20101",
        "FE05C20102",
        "FE05C20103",
        "FE05C20104",
        "FE04C717"
      ]);

      return [...(card.topButtons || []), ...(card.secondButtons || [])]
        .filter(([, command]) => hiddenCommands.has(command));
    });
  }

  _getHomeCollapsedButtons() {
    return [
      ["\u7a97\u5e18\u5f00", "FE05CF0101"],
      ["\u7a97\u5e18\u505c", "FE05CF0102"],
      ["\u7a97\u5e18\u5173", "FE05CF0100"],
      ["\u7a97\u7eb1\u5f00", "FE05CF0201"],
      ["\u7a97\u7eb1\u505c", "FE05CF0202"],
      ["\u7a97\u7eb1\u5173", "FE05CF0200"],
      ["\u5168\u90e8\u5f00", "FE05CF0001"],
      ["\u5168\u90e8\u505c", "FE05CF0002"],
      ["\u5168\u90e8\u5173", "FE05CF0000"]
    ];
  }

  _resolveGridClass(count, fallback = "grid-4") {
    if (count <= 1) {
      return "grid-1";
    }

    if (count === 2) {
      return "grid-2";
    }

    if (count === 3) {
      return "grid-3";
    }

    return fallback;
  }

  _resolveDpadSideButtons(card, side) {
    if (!card?.dpad) {
      return [];
    }

    const buttonMap = {
      left: ["FE04C708", "FE04C709"],
      right: ["FE04C702", "FE04C703"]
    };

    const labels = {
      "FE04C708": "\u4e0a\u4e00\u9875",
      "FE04C709": "\u4e0b\u4e00\u9875",
      "FE04C702": "\u97f3\u91cf+",
      "FE04C703": "\u97f3\u91cf-"
    };

    return buttonMap[side].map((command) => [labels[command], command]);
  }

  _renderNavButton(page, icon, label) {
    const active = page === this._page ? "nav-item active" : "nav-item";
    return `
      <button class="${active}" data-page-nav="${page}">
        <span class="nav-icon">${icon}</span>${label}
      </button>
    `;
  }

  _bindEvents() {
    this.shadowRoot.querySelectorAll("[data-page-nav]").forEach((button) => {
      button.addEventListener("click", () => {
        this._page = button.dataset.pageNav;
        this._render();
      });
    });

    this.shadowRoot.querySelectorAll("[data-command]").forEach((button) => {
      button.addEventListener("click", async () => {
        if (this._suppressNextClick) {
          this._suppressNextClick = false;
          return;
        }
        const toggleChannel = button.dataset.lightToggle;
        if (toggleChannel) {
          await this._toggleLightChannel(toggleChannel);
          return;
        }
        if (button.dataset.acPowerToggle) {
          await this._toggleAcPower();
          return;
        }
        if (!this._acPowerOn && button.classList.contains("ac-disabled-btn")) {
          return;
        }
        const command = button.dataset.command;
        await this._sendCommand(command);
      });
    });

    this.shadowRoot.querySelectorAll("[data-ac-temp-dial]").forEach((dial) => {
      dial.addEventListener("pointerdown", (event) => this._startAcTemperatureDrag(event));
    });

    this.shadowRoot.querySelectorAll("[data-rename-command]").forEach((button) => {
      const startRename = () => {
        this._clearRenameTimer();
        this._renamePressTimer = window.setTimeout(() => {
          this._suppressNextClick = true;
          this._openRenameDialog(button.dataset.renameCommand);
        }, 650);
      };

      const cancelRename = () => {
        this._clearRenameTimer();
      };

      button.addEventListener("mousedown", startRename);
      button.addEventListener("touchstart", startRename, { passive: true });
      button.addEventListener("mouseup", cancelRename);
      button.addEventListener("mouseleave", cancelRename);
      button.addEventListener("touchend", cancelRename);
      button.addEventListener("touchcancel", cancelRename);
      button.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        this._clearRenameTimer();
        this._suppressNextClick = true;
        this._openRenameDialog(button.dataset.renameCommand);
      });
    });

    this.shadowRoot.getElementById("rename-cancel")?.addEventListener("click", (event) => {
      event.preventDefault();
      this._closeRenameDialog();
    });

    this.shadowRoot.getElementById("rename-reset")?.addEventListener("click", async (event) => {
      event.preventDefault();
      await this._submitRenameDialog("reset");
    });

    this.shadowRoot.getElementById("rename-save")?.addEventListener("click", async (event) => {
      event.preventDefault();
      await this._submitRenameDialog("save");
    });

    this.shadowRoot.getElementById("rename-scene-input")?.addEventListener("keydown", async (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        await this._submitRenameDialog("save");
      }

      if (event.key === "Escape") {
        event.preventDefault();
        this._closeRenameDialog();
      }
    });

    this.shadowRoot.getElementById("rename-scene-input")?.addEventListener("input", (event) => {
      if (!this._renameDialog) {
        return;
      }

      this._renameDialog = {
        ...this._renameDialog,
        label: event.target.value
      };
    });
  }

  _clearRenameTimer() {
    if (this._renamePressTimer) {
      window.clearTimeout(this._renamePressTimer);
      this._renamePressTimer = null;
    }
  }

  _updateDynamicState() {
    const headerText = this.shadowRoot?.getElementById("header-title-text");
    if (headerText) {
      const logo = headerText.querySelector(".header-logo");
      if (logo) {
        logo.alt = this._resolveTitle();
      }
    }
  }

  _findCommandEntityId(payload) {
    if (!this._hass) {
      return "";
    }

    const normalizedPayload = String(payload || "").replace(/\s+/g, "").toUpperCase();
    const normalizedConfigMac = String(this._config.mac || "").replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
    const topicDown = this._config?.mac ? `/ACS/${this._config.mac}/down` : "";
    const matches = [];

    for (const [entityId, state] of Object.entries(this._hass.states || {})) {
      if (!entityId.startsWith("button.")) {
        continue;
      }

      const entityPayload = String(state?.attributes?.payload || "").replace(/\s+/g, "").toUpperCase();
      if (entityPayload !== normalizedPayload) {
        continue;
      }

      const entityTopicDown = state?.attributes?.topic_down || "";
      const entityConfiguredMac = String(state?.attributes?.configured_mac || "").replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
      let score = 1;

      if (normalizedConfigMac && entityConfiguredMac && entityConfiguredMac === normalizedConfigMac) {
        score = 3;
      } else if (topicDown && entityTopicDown === topicDown) {
        score = 2;
      }

      matches.push({ entityId, score });
    }

    if (!matches.length) {
      return "";
    }

    matches.sort((left, right) => right.score - left.score);
    return matches[0].entityId;
  }

  async _sendCommand(payload) {
    if (!this._hass) {
      return;
    }

    const entityId = this._findCommandEntityId(payload);
    if (entityId) {
      await this._hass.callService("button", "press", {
        entity_id: entityId
      });
      return;
    }
  }
}

class MofeiRemoteCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
  }

  _getSceneLabelFields() {
    return [
      { command: "FE04D000", key: "scene_theater", label: "\u5f71\u9662\u6a21\u5f0f" },
      { command: "FE04D001", key: "scene_ktv", label: "KTV \u6a21\u5f0f" },
      { command: "FE04D004", key: "scene_guest", label: "\u4f1a\u5ba2\u6a21\u5f0f" },
      { command: "FE04D002", key: "scene_game", label: "\u6e38\u620f\u6a21\u5f0f" },
      { command: "FE04D003", key: "scene_tv", label: "\u7535\u89c6\u6a21\u5f0f" },
      { command: "FE04D00D", key: "scene_leave", label: "\u79bb\u5f00\u6a21\u5f0f" }
    ];
  }

  _render() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }

    const sceneLabels = this._config?.scene_labels || {};
    const logoUrl = this._config?.logo_url || "";
    const sceneLabelInputs = this._getSceneLabelFields()
      .map(({ command, key, label }) => `
        <label>
          ${label}
          <input id="${key}" value="${sceneLabels[command] || ""}" placeholder="${label}" />
        </label>
      `)
      .join("");
    const title = this._config?.title || "鏅鸿兘涓帶";

    this.shadowRoot.innerHTML = `
      <style>
        .form {
          display: grid;
          gap: 12px;
          padding: 16px 0;
        }

        .section-title {
          margin-top: 8px;
          font-size: 12px;
          color: rgba(127,127,127,0.9);
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        label {
          display: grid;
          gap: 6px;
          font-size: 14px;
        }

        input {
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid rgba(127,127,127,0.35);
          background: transparent;
          color: inherit;
        }
      </style>
      <div class="form">
        <label>
          鏍囬
          <input id="title" value="${title}" placeholder="鏅鸿兘涓帶" />
        </label>
        <label>
          Logo URL
          <input id="logo_url" value="${logoUrl}" placeholder="/local/mofei/logo.png" />
        </label>
        <div class="section-title">\u573a\u666f\u540d\u79f0</div>
        ${sceneLabelInputs}
      </div>
    `;

    this.shadowRoot.getElementById("title").addEventListener("input", (event) => {
      this._emitConfigChange({ title: event.target.value });
    });

    this.shadowRoot.getElementById("logo_url").addEventListener("input", (event) => {
      this._emitConfigChange({ logo_url: event.target.value });
    });

    this._getSceneLabelFields().forEach(({ command, key }) => {
      this.shadowRoot.getElementById(key).addEventListener("input", (event) => {
        this._emitConfigChange({
          scene_labels: {
            ...(this._config?.scene_labels || {}),
            [command]: event.target.value
          }
        });
      });
    });
  }

  _emitConfigChange(changes) {
    const nextConfig = {
      ...this._config,
      ...changes
    };

    if (nextConfig.scene_labels) {
      nextConfig.scene_labels = Object.fromEntries(
        Object.entries(nextConfig.scene_labels)
          .filter(([, label]) => typeof label === "string" && label.trim())
      );
    }

    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: {
          config: nextConfig
        }
      })
    );
  }
}

customElements.define("mofei-remote-card", MofeiRemoteCard);
customElements.define("mofei-remote-card-editor", MofeiRemoteCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "mofei-remote-card",
  name: "Mofei Remote Card",
  description: "A physical-style remote control card for Mofei MQTT Bridge."
});

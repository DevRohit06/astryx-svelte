/**
 * @file Chinese overlay for the theme doc. Upstream's translation, with the
 * two entries that describe the `/built` split retranslated for a port whose
 * published themes are always built.
 */

/** @type {import('@astryx-svelte/cli/authoring').ReferenceTranslationDoc} */
export const docsZh = {
	description: 'Theme 提供者、自定义主题、亮/暗模式和组件样式覆盖。',
	sections: [
		{
			section: 'Quick Start',
			title: '快速开始',
			content: [
				null,
				null,
				null,
				{
					type: 'prose',
					text: '已发布的主题均为预构建版本（__built:true）：导入主题对象并搭配其 theme.css，无需运行时注入。'
				}
			]
		},
		{
			section: 'Available Themes',
			title: '可用主题',
			content: [
				null,
				null,
				{
					type: 'prose',
					text: '已发布主题：neutral（推荐起点）、butter、chocolate、gothic（仅暗色）、liquid-glass、matcha、stone、y2k。@astryx-svelte/theme-{name} = 预构建主题 + 图标注册表。/tokens = 纯数据（Node 可直接读取）。/theme.css = 样式表。'
				}
			]
		},
		{ section: 'Theme Props', title: 'Theme 属性', content: [null] },
		{
			section: 'Creating a Custom Theme',
			title: '创建自定义主题',
			content: [
				{
					type: 'prose',
					text: '使用 astryx-svelte theme add <slug> 生成脚手架，或手动 defineTheme。只覆盖与默认值不同的令牌。'
				},
				null
			]
		},
		{
			section: 'defineTheme',
			title: 'defineTheme',
			content: [
				{
					type: 'prose',
					text: '支持比例配置（typography、radius、motion）+ 显式令牌覆盖 + 组件覆盖。'
				},
				null,
				null
			]
		},
		{
			section: 'Building Themes for Production',
			title: '生产构建',
			content: [
				{
					type: 'prose',
					text: 'astryx-svelte theme build 将 defineTheme 编译为静态 CSS。输出 .css + .js（__built:true）+ .d.ts。'
				},
				null,
				null,
				null,
				null,
				null
			]
		},
		{
			section: 'Runtime vs Built Themes',
			title: '运行时 vs 构建',
			content: [
				{
					type: 'prose',
					text: '运行时：Theme 在挂载后的 effect 中注入样式。构建：静态 CSS 在首次渲染时就存在。已发布主题始终是构建版；自定义主题在服务端渲染前请先构建。'
				},
				null,
				null,
				null
			]
		},
		{
			section: 'Light/Dark Mode',
			title: '亮/暗模式',
			content: [
				{
					type: 'prose',
					text: "令牌值使用 [light, dark] 元组实现自动模式切换。Theme 上 mode='system'（默认）跟随系统偏好。"
				},
				null,
				null
			]
		},
		{
			section: 'Nesting Themes',
			title: '嵌套主题',
			content: [{ type: 'prose', text: '将不同部分包裹在独立的 <Theme> 提供者中。' }, null]
		},
		{
			section: 'useTheme',
			title: 'useTheme',
			content: [
				null,
				{
					type: 'prose',
					text: '这是只读的，且属性为 getter：请在 $derived 中读取 theme.mode / theme.tokens，不要解构。要更改主题/模式，在应用层管理状态并传递给 <Theme>。'
				},
				null,
				null,
				null
			]
		}
	]
};

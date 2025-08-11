# ![preview](image/README/preview.png)

EmbyLyricEnhance 是一个用于增强 Emby 歌词显示的插件，功能包括：

- 双语歌词单块高亮显示
- 解析歌词中 html 代码
- 歌词垂直显示

兼容 emby 版本：4.8.11.0

目前无法做到独立加载 JavaScript 文件以装载该插件，必须修改 Emby 程序。

欢迎提交issue和pr！

## 如何使用

### 自动安装（推荐）

若 Emby 版本与上面相同，可直接下载 [Release](https://github.com/oldkingOK/EmbyLyricEnhance/releases) 中的文件进行替换，Docker 版本可下载 `main.sh` 一键更改。

```bash
docker ps # 找到 container 名称
docker cp ./main.sh <container-name>:/tmp/ # 把 container-name 换成容器的名称
docker exec -it <container-name> /bin/sh /tmp/main.sh
```

若要撤销修改：

```bash
docker exec -it <container-name> /bin/sh main.sh undo
```

### 手动安装

> 请备份这两个文件
>
> - `dashboard-ui/modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js`
> - `dashboard-ui/modules/listview/listview.js`

1. 将 [replacement/emby-itemscontainer.js](replacement/emby-itemscontainer.js) 的内容复制，插入到 `dashboard-ui/modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js` 文件末尾的 `});` 之前

2. 编辑 `dashboard-ui/modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js` ，搜索 `toStart` 替换为 `toCenter`

3. 将 [replacement/listview.js](replacement/listview.js) 的内容复制，插入到 `dashboard-ui/modules/listview/listview.js` 文件末尾的 `});` 之前

### 刷新缓存

如果你已经看到多语言歌词显示，可以跳过此步骤。

两种方法

方法一：浏览器右键检查 → 网络 → 勾选“禁用缓存”，然后刷新页面

方法二：浏览器右键检查 → 应用程序 → 存储 → 清除网站数据，然后刷新页面

## 原理

- 劫持歌词文本加载，合并开始时间相同的歌词行
- 劫持歌词渲染过程，支持歌词中 HTML 代码解析
- 修改滚动调用的函数

## 另外

分享一个歌词css，粘贴到设置里的自定义css即可

- 字体大小：电脑端 150%，手机端 100%
- 歌词居中

```css
.listItem.lyricsItem {
	margin: 0 0;
	font-size: 150%;
}
.listItemBody.itemAction.listItemBody-noleftpadding.listItemBody-noverticalpadding.listItemBody-reduceypadding.listItemBody-1-lines {
    text-align: center;
}
:root{
	--lyrics-transform-origin: center center !important;
}
.vertical-list.itemsContainer.osdLyricsItemsContainer.padded-bottom{
	-webkit-padding-end: 0 !important;
    padding-inline-end: 0 !important;
}
@media(max-width:500px){
	.listItem.lyricsItem {
		font-size: 100%;
	}
}
```

# ![preview](image/README/preview.png)

[中文说明](./README_CN.md)

EmbyLyricEnhance is a plugin for enhancing the display of lyrics in Emby. Features include:

* Bilingual lyrics highlighting in a single block
* Parsing HTML code within the lyrics
* Vertically centered lyrics display

Compatible Emby version: 4.8.11.0

Currently, this plugin cannot be loaded as a standalone JavaScript file and requires modifying the Emby program.

Welcome to submit issues and PRs!

## How to Use

### Automatic Installation (Recommended)

If your Emby version matches the above, you can directly download the files from the [Release](https://github.com/oldkingOK/EmbyLyricEnhance/releases) page and replace them. For Docker users, you can use the provided `main.sh` script for one-click modification:

```bash
docker ps # Find the container name  
docker cp ./main.sh <container-name>:/tmp/ # Replace <container-name> with your container's name  
docker exec -it <container-name> /bin/sh /tmp/main.sh  
```

To undo the changes:

```bash
docker exec -it <container-name> /bin/sh main.sh undo  
```

### Manual Installation

> Please back up these two files first:
>
> - `dashboard-ui/modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js`
> - `dashboard-ui/modules/listview/listview.js`

1. Copy the entire content of [replacement/emby-itemscontainer.js](replacement/emby-itemscontainer.js) and paste it before the last `});` in `dashboard-ui/modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js`.
2. In the same file, replace all occurrences of `toStart` with `toCenter`.
3. Copy the entire content of [replacement/listview.js](replacement/listview.js) and paste it before the last `});` in `dashboard-ui/modules/listview/listview.js`.

### Refresh Cache

If multilingual lyrics display correctly, you can skip this step.

Two ways to clear cache:

1. Right-click → Inspect → Network → check *Disable cache*, then refresh the page
2. Right-click → Inspect → Application → Storage → Clear site data, then refresh the page

## How It Works

* Hijacks the lyrics text loading to merge lyrics lines with the same start time
* Hijacks the rendering process to parse HTML code inside lyrics
* Modifies the lyrics scroll function

## In Addition

Share a lyrics css that I use myself, just paste it into the custom css in the settings

- Font size: 150% on PC, 100% on mobile
- Lyrics centered

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
.lyricsItem-selected .lineplus {
	width: max-content;
    background: linear-gradient(to right, lightblue 0%, white 0%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0 auto;
}
```

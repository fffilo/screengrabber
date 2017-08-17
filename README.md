ScreenGrabber
=============

GNOME shell extension for creating and storing screenshots.

## Features

- create screenshot (indicator menu or ~~keyboard shorcuts~~)
	- desktop
	- monitor
	- window
	- selection
- save screenshot to local storage (see [saving screenshots](SAVING.md) for more info)
- ~~upload screenshot to cloud providers~~

#### Desktop screenshot

A full screen screenshot. If multiple monitors are connected entire desktop is used. In
other words content of each monitor is merged into one big image.

#### Monitor screenshot

Mouse drag over each monitor will highlight selection and you can choose your screenshot
area with left mouse click (use right mouse click or `ESC` key to cancel). This option is
disabled if only one monitor is connected.

#### Window screenshot

Mouse drag over each window will highlight selection and you can choose your screenshot
area with left mouse click (use right mouse click or `ESC` key to cancel). By default an
small offset is used around window area (shadow). You can disable this in preferences.

#### Screenshot selection

Allowing user to define his screenshot area by mouse drag.

## Installation

- ~~install using [GNOME Shell extension website](https://extensions.gnome.org)~~
- build and install from source
	- download source from GitHub (clone repository or download zip)
	- from `screengraber` directory execute `make install`
- bash one-liner
	- `wget https://raw.githubusercontent.com/fffilo/screengraber/master/install.sh -O - | sh`

## Credits

- [Giovanni Campagna](https://github.com/gcampax/), author of [convenience.js](https://github.com/gcampax/gnome-shell-extensions/blob/master/lib/convenience.js)

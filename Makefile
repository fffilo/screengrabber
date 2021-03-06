INSTALL_PATH = ~/.local/share/gnome-shell/extensions
INSTALL_NAME = screengrabber@gnome-shell-exstensions.fffilo.github.com
BUILD_DIR = _build
FILES = assets/ CHANGELOG.md clipboard.js container.js convenience.js COPYING extension.js file.js grabber.js icons.js indicator.js keybind.js metadata.json notification.js prefs.css prefs.js provider.js README.md SAVING.md schemas/ screen.js settings.js stylesheet.css translation.js

install: build
	rm -rf $(INSTALL_PATH)/$(INSTALL_NAME)
	mkdir -p $(INSTALL_PATH)/$(INSTALL_NAME)
	cp -r --preserve=timestamps $(BUILD_DIR)/* $(INSTALL_PATH)/$(INSTALL_NAME)
	rm -rf $(BUILD_DIR)
	echo Installed in $(INSTALL_PATH)/$(INSTALL_NAME)

archive: build
	cd ${BUILD_DIR} && zip -r ../archive.zip *
	rm -rf $(BUILD_DIR)
	echo Archive created

build: compile-schema
	rm -rf $(BUILD_DIR)
	mkdir $(BUILD_DIR)
	cp -r --preserve=timestamps $(FILES) $(BUILD_DIR)
	echo Build was successfull

compile-schema:
	glib-compile-schemas schemas

clean:
	rm -rf $(BUILD_DIR)

uninstall:
	rm -rf $(INSTALL_PATH)/$(INSTALL_NAME)

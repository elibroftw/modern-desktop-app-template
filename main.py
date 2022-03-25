# `yarn py` is an alternative to `yarn tauri dev`
#  to speed up UI development. Tauri calls from React will not work.
import os
import threading
import webview

import argparse
from contextlib import suppress
import sys

from time import time

config = {
    'min_size': (1000, 700),
}


class Api:
    def fullscreen(self):
        webview.windows[0].toggle_fullscreen()

    def save_content(self, content):
        filename = webview.windows[0].create_file_dialog(webview.SAVE_DIALOG)
        if not filename:
            return

        with open(filename, 'w') as f:
            f.write(content)

    def ls(self):
        return os.listdir('.')


def get_entrypoint():
    def exists(path):
        return os.path.exists(os.path.join(os.path.dirname(__file__), path))

    for path in ('./build/index.html', '../gui/index.html', '../Resources/gui/index.html', './gui/index.html'):
        if exists(path):
            return path
    raise Exception('No index.html found')


def set_interval(interval):
    def decorator(function):
        def wrapper(*args, **kwargs):
            stopped = threading.Event()

            def loop(): # executed in another thread
                while not stopped.wait(interval): # until stopped
                    function(*args, **kwargs)

            t = threading.Thread(target=loop)
            t.daemon = True # stop if the program exits
            t.start()
            return stopped
        return wrapper
    return decorator


@set_interval(1)
def update_ticker():
    if len(webview.windows) > 0:
        webview.windows[0].evaluate_js('window.pywebview.state.setTicker("%d")' % time())


if __name__ == '__main__':
    parser = argparse.ArgumentParser(exit_on_error=False)
    parser.add_argument('--debug', action='store_true')
    entry_point = get_entrypoint()
    IS_FROZEN = getattr(sys, 'frozen', False)
    if not IS_FROZEN:
        with suppress(argparse.ArgumentError):
            parser.add_argument('--devpath', default=entry_point)
            args = parser.parse_args()
            entry_point = args.devpath

    window = webview.create_window('pywebview-react boilerplate', entry_point, js_api=Api(), **config)
    webview.start(update_ticker, debug=True)

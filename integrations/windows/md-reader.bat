@echo off
REM md-reader — Windows Explorer → WSL2 bridge
REM
REM This bat file is called by Windows when you right-click a .md file
REM and choose "Open with md-reader". It converts the Windows path to
REM a Linux path via wslpath, then runs the CLI through bun in WSL2.
REM
REM Installed to: %LOCALAPPDATA%\Programs\md-reader\md-reader.bat
REM Registry:     HKCU\Software\Classes\MdReader.MarkdownFile

REM %~1 strips outer quotes from the argument Windows passes us.
REM We re-quote for the wslpath call to handle spaces in paths.
REM Use bash -lc (login shell) to ensure PATH includes bun.
REM Redirect stderr to a log file for debugging.
wsl.exe bash -lc "bun /home/mj/projects/markdown-reader/src/cli.ts \"$(wslpath -u '%~1')\"" 2> "%TEMP%\md-reader-error.log"
if %ERRORLEVEL% NEQ 0 (
    echo md-reader failed. See error log:
    type "%TEMP%\md-reader-error.log"
    pause
)

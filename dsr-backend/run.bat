@echo off
set "JAVA_HOME=C:\Program Files\Java\jdk-17"
if not exist "%JAVA_HOME%\bin\java.exe" (
    echo ERROR: Java not found at %JAVA_HOME%\bin\java.exe
    pause
    exit /b 1
)
call mvnw.cmd clean spring-boot:run
pause

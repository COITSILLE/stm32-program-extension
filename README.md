# STM32 One-Click Program

Program STM32 MCUs directly from VS Code using STM32CubeProgrammer CLI.

This extension provides one-click programming, optional CMake build integration, and a configurable reset-after-program behavior.


## Features

- Program firmware to STM32 from VS Code.
- Toggle reset-after-program quickly.
- Status bar button for fast access.

## Requirements

- STM32CubeProgrammer installed.
- CMake Tools extension (`ms-vscode.cmake-tools`) for Build & Program.
- A workspace that contains generated `.elf` or `.hex` outputs.

## Commands

Open Command Palette and run:

- `STM32-Program-1-Click: Program (No Build)`
- `STM32-Program-1-Click: Build & Program`
- `STM32-Program-1-Click: Select CubeProgrammer Path`
- `STM32-Program-1-Click: Toggle Reset After Program`

## Configuration

Settings namespace: `STM32-Program-1-Click`

- `STM32-Program-1-Click.programmerPath`
  - Path to `STM32_Programmer_CLI.exe`.
- `STM32-Program-1-Click.interface`
  - Interface type: `SWD` or `JTAG`.
- `STM32-Program-1-Click.resetAfterProgram`
  - If `true`, extension appends `-rst` after programming.

## Typical Workflow

### Program only

1. Build your project using your existing flow.
2. Run `STM32-Program-1-Click: Program (No Build)`.

### Build and program

1. Ensure CMake project is available (`CMakeLists.txt` exists).
2. Run `STM32-Program-1-Click: Build & Program`.
3. Extension runs:
   - `cmake.configure`
   - `cmake.build`
   - STM32CubeProgrammer CLI program command

## Troubleshooting

### STM32CubeProgrammer not found

- Run `STM32-Program-1-Click: Select CubeProgrammer Path`.
- Or install STM32CubeProgrammer from ST website.

### Build & Program fails before programming

- Confirm CMake Tools is installed and enabled.
- Confirm `CMakeLists.txt` exists in workspace.
- Try running `CMake: Configure` and `CMake: Build` manually once.

### Program command returns success but progress characters look strange

- This is usually a terminal encoding/font display issue.
- If verification passes, programming is still valid.

## Repository

- Home: https://github.com/COITSILLE/stm32-program-extension
- Issues: https://github.com/COITSILLE/stm32-program-extension/issues

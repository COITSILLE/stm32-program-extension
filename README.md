# STM32 One-Click Program

Program STM32 MCUs directly from VS Code using STM32CubeProgrammer CLI.

This extension provides one-click programming, optional CMake build integration, and a configurable reset-after-program behavior.

## Features

- Program firmware to STM32 from VS Code.
- Build with CMake Tools, then program.
- Auto-detect STM32CubeProgrammer CLI path (or set it manually).
- Toggle reset-after-program quickly.
- Status bar button for fast access.

## Requirements

- VS Code 1.74.0 or later.
- STM32CubeProgrammer installed.
- CMake Tools extension (`ms-vscode.cmake-tools`) for Build & Program.
- A workspace that contains generated `.elf` or `.hex` outputs.

## Commands

Open Command Palette and run:

- `STM32Program1Click: Program (No Build)`
- `STM32Program1Click: Build & Program`
- `STM32Program1Click: Select CubeProgrammer Path`
- `STM32Program1Click: Toggle Reset After Program`

## Configuration

Settings namespace: `STM32Program1Click`

- `STM32Program1Click.programmerPath`
  - Path to `STM32_Programmer_CLI.exe` (or CLI binary on Linux).
- `STM32Program1Click.interface`
  - Interface type: `SWD` or `JTAG`.
- `STM32Program1Click.autoBuild`
  - Reserved for workflow preference (current command behavior is explicit by command choice).
- `STM32Program1Click.resetAfterProgram`
  - If `true`, extension appends `-rst` after programming.

## Typical Workflow

### Program only

1. Build your project using your existing flow.
2. Run `STM32Program1Click: Program (No Build)`.

### Build and program

1. Ensure CMake project is available (`CMakeLists.txt` exists).
2. Run `STM32Program1Click: Build & Program`.
3. Extension runs:
   - `cmake.configure`
   - `cmake.build`
   - STM32CubeProgrammer CLI program command

## Output and Verification

Programming output is written to the output channel:

- Output channel name: `STM32 Programmer`

On success, the extension checks for verification text:
- `Download verified successfully`

## Troubleshooting

### STM32CubeProgrammer not found

- Run `STM32Program1Click: Select CubeProgrammer Path`.
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

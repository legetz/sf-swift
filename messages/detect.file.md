# description
Scan a directory for files matching one or more suffix types.

# args.path.description
Path to the directory to scan. Defaults to the current working directory when omitted.

# flags.target-dir.description
Alternate directory to scan when no positional path is provided.

# flags.type.description
Repeatable suffix filter (e.g., `.rej`, `.log`). At least one is required.

# flags.max.description
Maximum number of matches to collect before stopping the scan.

# errors.type.required
You must provide at least one `--type` value.

# errors.max.outOfRange
`--max` must be a positive integer when provided.

# errors.matches.found
❌ Found %s matching file(s). Please resolve them before proceeding.

# examples
- Scan for git conflict rejects and Apex debug logs inside the current directory:
  <%= config.bin %> <%= command.id %> --type .rej --type .log

- Scan a subdirectory and stop after the first match:
  <%= config.bin %> <%= command.id %> ./force-app --type .tmp --max 1

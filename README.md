# nsync
Incremental backup tool written in node.js.

## Configuration
```yml
# config.yml

sync:
  - id: videos
    compare: size # optional - size | checksum | auto | exist
    src: C:\Users\user\Pictures
    dest: \\remote\Pictures
    excludeRegex: # optional
      - .*(\\|\/)Holidays 2019$

excludeRegex: # optional - applies globally
  - .*(\\|\/)desktop.ini$
  - .*(\\|\/)node_modules$

autoCompareBySizeThreshold: 5000000000 # optional - value in bytes
```

## Log
A log is generated each time the application is run. Output is printed to the console as well as to a file, which follows the name convention: `YYYYMMDD-HHmmss.log`

Logs are divided by operation type:
```
copy
delete
info
error
```

The operations above are wrapped in squared brackets and can be filtered as follows:

### PowerShell
```powershell
Get-Content 20240503-020535.log | Select-String -Pattern "\[delete\]" | Out-File delete.log
```

### Unix
```bash
cat 20240503-020535.log | grep "\[delete\]" > delete.log
```


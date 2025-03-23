"""
Direct fix for syntax errors in app.py
"""

def main():
    print("Starting direct syntax fix...")
    
    with open('app.py', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Save a backup
    with open('app.py.bak.direct', 'w', encoding='utf-8') as f:
        f.writelines(lines)
        print("Backup saved to app.py.bak.direct")
    
    # Fix for try without except at line 254
    try_line_254 = False
    for i in range(250, 270):
        if 'try:' in lines[i] and not try_line_254:
            try_line_254 = True
            print(f"Found try statement at line {i+1}")
            
            # Look for matching except or finally
            has_matching_except = False
            for j in range(i+1, i+15):
                if j < len(lines) and ('except' in lines[j] or 'finally:' in lines[j]):
                    has_matching_except = True
                    break
            
            if not has_matching_except:
                print(f"Missing except after try at line {i+1}, fixing...")
                # Find the else: statement and insert except before it
                for j in range(i+1, i+20):
                    if j < len(lines) and 'else:' in lines[j]:
                        # Insert except block before else
                        indent = ' ' * (len(lines[j]) - len(lines[j].lstrip()))
                        except_line = indent + "except Exception as e:\n"
                        error_line = indent + "    logger.error(f\"Erro ao acessar URL {url}: {str(e)}\")\n"
                        lines.insert(j, except_line)
                        lines.insert(j+1, error_line)
                        print(f"Inserted except block before line {j+1}")
                        break
    
    # Fix for indentation issue at line 515
    for i in range(510, 525):
        if 'if not titulo:' in lines[i]:
            next_line = lines[i+1]
            if 'continue' in next_line and len(next_line.strip()) == len('continue'):
                # Fix indentation
                print(f"Found indentation issue at line {i+2}, fixing...")
                indent = ' ' * (len(lines[i]) - len(lines[i].lstrip()))
                lines[i+1] = indent + '    continue\n'
    
    # Write fixed file
    with open('app_fixed.py', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    print("Fixed code written to app_fixed.py")
    print("To test, run: python -m py_compile app_fixed.py")

if __name__ == "__main__":
    main() 
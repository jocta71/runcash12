#!/usr/bin/env python3
"""
Quick syntax fix script for app.py

This script applies a direct fix to the most critical syntax errors in app.py.
It focuses on the error at line 477 and the missing except block after try at line 395.
"""

import os
import re
import sys
import shutil
from datetime import datetime

def ensure_backup(file_path):
    """Create a backup of the file if it doesn't exist."""
    backup_path = f"{file_path}.bak.{datetime.now().strftime('%Y%m%d%H%M%S')}"
    if os.path.exists(file_path):
        shutil.copy2(file_path, backup_path)
        print(f"Backup created: {backup_path}")
    else:
        print(f"Error: File {file_path} not found.")
        sys.exit(1)

def fix_line_477_error(content):
    """Fix the critical syntax error around line 477."""
    # The pattern to find
    pattern = re.compile(
        r'([\s]+if roletas_encontradas > 0:[\s]+.*?'
        r'last_success_time = time\.time\(\)[\s]+.*?'
        r'# Se tivermos sucesso com esta API, podemos passar para a próxima etapa[\s]+.*?'
        r')(break[\s]+)(except ValueError:)',
        re.DOTALL
    )
    
    # The fixed version with proper indentation and structure
    replacement = r'\1break\n                        except ValueError:'
    
    # Apply the fix
    new_content = pattern.sub(replacement, content)
    
    # Check if we actually made a change
    if new_content == content:
        print("WARNING: Could not find the pattern to fix around line 477.")
        return content
    else:
        print("✓ Fixed syntax error around line 477.")
        return new_content

def fix_line_680_error(content):
    """Fix the missing except block after try at line 680."""
    # The pattern to find
    pattern = re.compile(
        r'([\s]+while executando:[\s]+try:[\s]+.*?'
        r'# Delay aleatório entre verificações[\s]+.*?'
        r'time\.sleep\(random\.uniform\(.*?\)\).*?'
        r')([\s]+except Exception as e:)',
        re.DOTALL
    )
    
    # Check if there's a missing except block
    if not pattern.search(content):
        # Add the missing except block
        pattern2 = re.compile(
            r'([\s]+while executando:[\s]+try:[\s]+.*?'
            r'# Delay aleatório entre verificações[\s]+.*?'
            r'time\.sleep\(random\.uniform\(.*?\)\).*?)'
            r'([\s]+# Se houver erro)',
            re.DOTALL
        )
        
        replacement2 = r'\1\n        except Exception as e:\n            logging.error(f"Erro na extração: {str(e)}")\n\n        \2'
        
        new_content = pattern2.sub(replacement2, content)
        
        # Check if we actually made a change
        if new_content == content:
            print("WARNING: Could not find the pattern to fix around line 680.")
            return content
        else:
            print("✓ Fixed missing except block after try at line 680.")
            return new_content
    
    return content

def fix_line_515_error(content):
    """Fix indentation issues around line 515."""
    # The pattern to find
    pattern = re.compile(
        r'([\s]+titulo = titulo_element\.text\.strip\(\)[\s]+if not titulo:[\s]+)(continue)',
        re.DOTALL
    )
    
    # The fixed version with proper indentation
    replacement = r'\1                                        continue'
    
    # Apply the fix
    new_content = pattern.sub(replacement, content)
    
    # Check if we actually made a change
    if new_content == content:
        print("WARNING: Could not find the pattern to fix around line 515.")
        return content
    else:
        print("✓ Fixed indentation issue around line 515.")
        return new_content

def main():
    # File to fix
    script_dir = os.path.dirname(os.path.abspath(__file__))
    app_file = os.path.join(script_dir, 'app.py')
    
    print(f"Looking for file at: {app_file}")
    
    # Create a backup
    ensure_backup(app_file)
    
    # Read the file content
    with open(app_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Apply fixes
    content = fix_line_477_error(content)
    content = fix_line_680_error(content)
    content = fix_line_515_error(content)
    
    # Write the fixed content
    with open(app_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\nFixes applied to {app_file}")
    print("To verify, run: python -m py_compile app.py")

if __name__ == "__main__":
    main() 
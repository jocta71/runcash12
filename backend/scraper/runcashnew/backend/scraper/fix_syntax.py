import re

def fix_syntax_errors():
    print("Starting syntax error fix...")
    
    # Read the original file
    with open('app.py', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Detect and fix the most common syntax errors
    fixed_lines = []
    in_try_blocks = []  # Stack of try blocks
    
    for i, line in enumerate(lines):
        line_num = i + 1
        indentation = len(line) - len(line.lstrip())
        
        # Fix indentation issues at line 516
        if line_num == 516 and "continue" in line:
            # Correct the indentation
            fixed_line = " " * 24 + "continue\n"  # Use proper indentation
            fixed_lines.append(fixed_line)
            print(f"Fixed indentation at line {line_num}")
            continue
        
        # Track try blocks
        if "try:" in line:
            in_try_blocks.append((line_num, indentation))
            print(f"Found try block at line {line_num}")
        
        # Check for except or finally to close the try block
        if in_try_blocks and ("except" in line or "finally:" in line):
            if len(in_try_blocks) > 0:
                in_try_blocks.pop()  # Remove the last try block
        
        # If we're at line 477 (the reported error) and still in a try block from line 395, add an except
        if line_num == 477 and "break" in line and any(try_line == 395 for try_line, _ in in_try_blocks):
            # Add proper except block after try block starting at line 395
            fixed_lines.append(line)  # Add the current line first
            fixed_lines.append(" " * 28 + "except Exception as e:\n")
            fixed_lines.append(" " * 32 + "logger.error(f\"Erro ao processar dados JSON: {str(e)}\")\n")
            # Remove the try block from our stack
            in_try_blocks = [block for block in in_try_blocks if block[0] != 395]
            print(f"Added except block after line {line_num} for try at line 395")
            continue
        
        # Fix other try blocks without except (like at line 680)
        if line_num == 843 and any(try_line == 680 for try_line, _ in in_try_blocks):
            # Need to close the try block from line 680 before encountering the except at line 843
            curr_indent = " " * 12  # Approximate indentation based on context
            fixed_lines.append(curr_indent + "except Exception as e:\n")
            fixed_lines.append(curr_indent + "    logger.error(f\"Erro na extração: {str(e)}\")\n")
            # Remove this try block from our stack
            in_try_blocks = [block for block in in_try_blocks if block[0] != 680]
            print(f"Added missing except block before line {line_num} for try at line 680")
        
        fixed_lines.append(line)
        
        # Add missing except blocks for other try statements at specific lines
        if line_num == 508 and any(try_line == 508 for try_line, _ in in_try_blocks):
            curr_indent = " " * 32  # Approximate indentation
            after_line = fixed_lines[-1]
            if "try:" in after_line and not any(next_line.strip().startswith("except") for next_line in lines[i+1:i+10]):
                # Find next line with same or less indentation to insert except before
                for j in range(i+1, min(i+20, len(lines))):
                    if len(lines[j]) - len(lines[j].lstrip()) <= indentation:
                        # Insert except before this line
                        fixed_lines.append(curr_indent + "except Exception as e:\n")
                        fixed_lines.append(curr_indent + "    logger.error(f\"Erro ao processar elemento: {str(e)}\")\n")
                        in_try_blocks = [block for block in in_try_blocks if block[0] != 508]
                        print(f"Added except block for try at line 508")
                        break
    
    # Write the fixed file
    with open('app_fixed.py', 'w', encoding='utf-8') as f:
        f.writelines(fixed_lines)
    
    print("Syntax fixes complete. New file written to app_fixed.py")
    print(f"Warning: Still have {len(in_try_blocks)} unclosed try blocks.")
    if in_try_blocks:
        print(f"Unclosed try blocks at lines: {[line for line, _ in in_try_blocks]}")

if __name__ == "__main__":
    fix_syntax_errors() 
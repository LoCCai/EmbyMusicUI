#!/usr/bin/env python3
import sys
import os
import base64
import re

def encode_file_base64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()

def process_template(input_path, output_path):
    if not os.path.isfile(input_path):
        print(f"Error: input file '{input_path}' does not exist.")
        sys.exit(1)

    pattern = re.compile(r"\{include\s+(.+?)\}")

    with open(input_path, "r") as f:
        content = f.read()

    def replacer(match):
        file_path = match.group(1)
        encoded = encode_file_base64(file_path)
        return f'$(echo {encoded} | base64 -d)'

    new_content = pattern.sub(replacer, content)

    with open(output_path, "w") as f:
        f.write(new_content)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <input_template> <output_script>")
        sys.exit(1)
    process_template(sys.argv[1], sys.argv[2])

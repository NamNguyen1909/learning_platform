import os

def generate_tree(startpath, exclude_dirs):
    with open("structure.txt", "w", encoding="utf-8") as f:
        for root, dirs, files in os.walk(startpath):
            # Bỏ qua thư mục ẩn và các thư mục rác trong danh sách loại trừ
            dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
            level = root.replace(startpath, '').count(os.sep)
            indent = ' ' * 4 * (level)
            f.write(f"{indent}{os.path.basename(root)}/\n")
            subindent = ' ' * 4 * (level + 1)
            for file in files:
                if not file.startswith('.'):
                    f.write(f"{subindent}{file}\n")

# Danh sách thư mục cần loại bỏ để tránh loãng ngữ cảnh AI
exclude = ['node_modules', 'venv', '__pycache__', 'dist', 'build']
generate_tree(os.getcwd(), exclude)
print("Đã xuất cấu trúc thư mục sạch vào file structure.txt thành công!")
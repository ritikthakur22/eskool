import os

def fix_file(path, var_name, res_name):
    with open(path, 'r') as f:
        content = f.read()
    
    old1 = f"set{var_name}({res_name}.data);"
    new1 = f"set{var_name}(Array.isArray({res_name}.data) ? {res_name}.data : []);"
    content = content.replace(old1, new1)
    
    old2 = f"set{var_name}(res.data);"
    new2 = f"set{var_name}(Array.isArray(res.data) ? res.data : []);"
    content = content.replace(old2, new2)
    
    with open(path, 'w') as f:
        f.write(content)

fix_file('apps/mobile/src/features/exams/screens/ExamsScreen.tsx', 'Exams', 'examRes')
fix_file('apps/mobile/src/features/results/screens/ResultScreen.tsx', 'Exams', 'examRes')
fix_file('apps/mobile/src/features/results/screens/ResultScreen.tsx', 'Students', 'studentRes')
fix_file('apps/mobile/src/features/homework/screens/HomeworkScreen.tsx', 'Homeworks', 'res')

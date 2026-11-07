import zipfile, os
skip = {'.git', 'Old image', 'Nouveau Photo', '.claude', 'supabase', '__pycache__'}
skipf = {'serve.py', 'impano-hostinger.zip', '.gitignore', '.build-zip.py', '.build-seed.js', 'logo.PNG', 'impano-mysql.sql'}
n = 0
with zipfile.ZipFile('impano-hostinger.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for d, ds, fs in os.walk('.'):
        ds[:] = [x for x in ds if x not in skip]
        for f in fs:
            p = os.path.join(d, f); rel = os.path.relpath(p, '.').replace(os.sep, '/')
            if f == 'config.php' or f in skipf or f.endswith('.sqlite') or (rel.startswith('api/storage/') and f != '.htaccess'): continue
            z.write(p, rel); n += 1
print(n, 'fichiers', round(os.path.getsize('impano-hostinger.zip') / 1e6, 1), 'Mo')
with zipfile.ZipFile('impano-hostinger.zip') as z:
    print([x for x in z.namelist() if x.startswith(('api', 'uploads')) or x == '.htaccess'])

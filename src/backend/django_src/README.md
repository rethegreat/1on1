# How to set up

1. Set up your venv
```bash
$ python3 -m venv venv
$ source ./venv/bin/activate
```

2. Install the required packages
```bash
$ pip3 install -r requirements.txt
```

OPTIONAL. **If you install new packages, regenerate the requirements.txt**
```bash
$ pip3 freeze > requirements.txt
```

Your directory should then look something like this:
```
(venv) kurtis@Kurtiss-MacBook-Air django_src % tree -L 2
.
├── README.md
├── django_src
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── manage.py
├── requirements.txt
├── run.sh
├── startup.sh
└── venv
    ├── bin
    ├── include
    ├── lib
    └── pyvenv.cfg

6 directories, 11 files

```
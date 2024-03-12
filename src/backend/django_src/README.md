# How to set up

Assuming this is from a fresh install of Ubuntu 20.04.6 LTS onto VirtualBox.

1. Ensure you have sudo access, open terminal and type what is below, then restart 
```
su -
usermod -aG sudo {your_username}
exit
``` 

2. Run the startup script
```
source startup.sh
```

3. Run the server 
```
./run.sh
```

<!-- 1. Set up your venv
```bash
$ python3 -m venv venv
$ source ./venv/bin/activate
``` -->

<!-- 2. Install the required packages
```bash
$ pip3 install -r requirements.txt
``` -->

<!-- OPTIONAL. **If you install new packages, regenerate the requirements.txt**
```bash
$ pip3 freeze > requirements.txt
``` -->

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
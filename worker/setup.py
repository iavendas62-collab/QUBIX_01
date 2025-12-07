from setuptools import setup, find_packages

setup(
    name="qubix-worker",
    version="1.0.0",
    description="QUBIX Worker Client - Connect your hardware to earn QUBIC",
    author="QUBIX Team",
    author_email="dev@qubix.io",
    url="https://qubix.io",
    packages=find_packages(),
    install_requires=[
        "websockets>=12.0",
        "psutil>=5.9.0",
        "torch>=2.1.0",
        "docker>=7.0.0",
    ],
    entry_points={
        'console_scripts': [
            'qubix-worker=qubix_worker:main',
        ],
    },
    python_requires=">=3.10",
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3.10",
    ],
)

from setuptools import setup, find_packages

setup(
    name="qubix-sdk",
    version="1.0.0",
    description="Python SDK for Qubix Compute Hub",
    author="Qubix Team",
    packages=find_packages(),
    install_requires=[
        "requests>=2.31.0",
        "websocket-client>=1.6.0"
    ],
    python_requires=">=3.8",
)

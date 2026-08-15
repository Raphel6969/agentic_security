from setuptools import setup, find_packages

setup(
    name="sentinel-sdk",
    version="0.1.0",
    description="Runtime AI security firewall and SDK for agentic tool calls",
    author="Sentinel Security Team",
    packages=find_packages(),
    install_requires=[
        "httpx>=0.27.0",
    ],
    python_requires=">=3.10",
)

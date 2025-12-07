#!/usr/bin/env python3
"""
Example: Register as a compute provider
"""

from qubix import QubixClient

# Initialize client
client = QubixClient(api_url="http://localhost:3001")

# Register as provider
print("Registering as provider...")
provider = client.register_provider(
    address="QUBIC_ADDRESS_HERE",
    compute_power=100,  # TFLOPS
    price_per_hour=10  # QUBIC per hour
)

print(f"✅ Registered successfully!")
print(f"Provider ID: {provider.id}")
print(f"Reputation: {provider.reputation}")

# List all providers
providers = client.list_providers()
print(f"\nTotal active providers: {len(providers)}")

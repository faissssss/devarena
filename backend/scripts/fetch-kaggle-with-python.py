#!/usr/bin/env python3
import json
import os
from kaggle import api

# Authenticate using environment variables
api.authenticate()

# Get list of competitions
competitions = api.competitions_list()

# Convert to list of dicts with all available fields
result = []
for comp in competitions:
    comp_dict = {
        'id': comp.id,
        'ref': comp.ref,
        'title': comp.title,
        'url': comp.url,
        'deadline': str(comp.deadline) if comp.deadline else None,
        'category': comp.category,
        'reward': comp.reward,
        'teamCount': comp.teamCount,
        'userHasEntered': comp.userHasEntered,
        'enabledDate': str(comp.enabledDate) if hasattr(comp, 'enabledDate') and comp.enabledDate else None,
        'description': comp.description if hasattr(comp, 'description') else None,
    }
    result.append(comp_dict)

# Print as JSON
print(json.dumps(result, indent=2))

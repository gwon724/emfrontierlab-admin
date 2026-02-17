#!/usr/bin/env python3
"""
Update all button styles to:
- Default: bg-black text-white
- Hover: hover:bg-gray-700
Remove gradients and use simple solid colors
"""

import re

def update_button_styles(content):
    """Update button class names to use black/gray theme"""
    
    # Pattern 1: Replace gradient buttons (primary action buttons)
    # from-gray-800 to-gray-900 -> bg-black
    # hover:from-gray-900 hover:to-black -> hover:bg-gray-700
    content = re.sub(
        r'bg-gradient-to-r from-gray-800 to-gray-900 text-white[^"]*?hover:from-gray-900 hover:to-black',
        'bg-black text-white hover:bg-gray-700',
        content
    )
    
    # Pattern 2: Other gradient patterns
    content = re.sub(
        r'bg-gradient-to-r from-\w+-\d+ to-\w+-\d+([^"]*?)hover:from-\w+-\d+ hover:to-\w+-\d+',
        r'bg-black\1hover:bg-gray-700',
        content
    )
    
    # Pattern 3: Simple gray buttons
    # bg-gray-800 hover:bg-gray-900 -> bg-black hover:bg-gray-700
    content = re.sub(
        r'bg-gray-800([^"]*?)hover:bg-gray-900',
        r'bg-black\1hover:bg-gray-700',
        content
    )
    
    # bg-gray-700 hover:bg-gray-800 -> bg-black hover:bg-gray-700
    content = re.sub(
        r'bg-gray-700([^"]*?)hover:bg-gray-800',
        r'bg-black\1hover:bg-gray-700',
        content
    )
    
    # bg-gray-600 hover:bg-gray-700 -> bg-black hover:bg-gray-700
    content = re.sub(
        r'bg-gray-600([^"]*?)hover:bg-gray-700',
        r'bg-black\1hover:bg-gray-700',
        content
    )
    
    # Pattern 4: Colored gradients (blue, purple, etc) -> bg-black
    content = re.sub(
        r'bg-gradient-to-r from-blue-\d+ to-\w+-\d+([^"]*?)hover:from-\w+-\d+ hover:to-\w+-\d+',
        r'bg-black\1hover:bg-gray-700',
        content
    )
    
    content = re.sub(
        r'bg-gradient-to-r from-purple-\d+ to-\w+-\d+([^"]*?)hover:from-\w+-\d+ hover:to-\w+-\d+',
        r'bg-black\1hover:bg-gray-700',
        content
    )
    
    # Pattern 5: White/light buttons (secondary actions) -> keep lighter but still follow theme
    # bg-white hover:bg-blue-50 -> bg-gray-200 hover:bg-gray-300 (or make these black too?)
    # Let's make ALL buttons black for consistency
    content = re.sub(
        r'bg-white text-blue-\d+([^"]*?)hover:bg-blue-\d+',
        r'bg-black text-white\1hover:bg-gray-700',
        content
    )
    
    # Pattern 6: Border buttons (cancel buttons) -> bg-black with white text
    # This was: border text-gray-700 hover:bg-gray-50
    content = re.sub(
        r'border border-gray-\d+ text-gray-\d+([^"]*?)hover:bg-gray-\d+',
        r'bg-black text-white\1hover:bg-gray-700',
        content
    )
    
    # Pattern 7: Gray background buttons
    content = re.sub(
        r'bg-gray-200 text-gray-700([^"]*?)hover:bg-gray-300',
        r'bg-black text-white\1hover:bg-gray-700',
        content
    )
    
    return content

# Read and update admin dashboard
with open('/home/user/webapp/app/admin/dashboard/page.tsx', 'r', encoding='utf-8') as f:
    admin_content = f.read()

admin_updated = update_button_styles(admin_content)

with open('/home/user/webapp/app/admin/dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(admin_updated)

print("✅ Admin dashboard buttons updated")

# Read and update client dashboard
with open('/home/user/client-site/app/client/dashboard/page.tsx', 'r', encoding='utf-8') as f:
    client_content = f.read()

client_updated = update_button_styles(client_content)

with open('/home/user/client-site/app/client/dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(client_updated)

print("✅ Client dashboard buttons updated")

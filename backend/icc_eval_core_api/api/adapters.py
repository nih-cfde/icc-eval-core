"""
Custom adapters for django-allauth social authentication.
"""

from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.account.adapter import DefaultAccountAdapter

from django.utils.text import slugify

class ORCIDSocialAccountAdapter(DefaultSocialAccountAdapter):
    """
    Custom adapter for social account authentication.
    Handles ORCID-specific data extraction and user creation.
    """
    
    def pre_social_login(self, request, sociallogin):
        """
        Hook called before a social account is linked.
        Can be used to customize the behavior.
        """
        pass
    
    def populate_user(self, request, sociallogin, data):
        """
        Populate user instance from social provider data.
        For ORCID, extract name and email information.
        """
        user = super().populate_user(request, sociallogin, data)

        print(f"Provider {sociallogin.account.provider} data: {data}", flush=True)
        
        if sociallogin.account.provider == 'orcid':
            # Store ORCID identifier
            orcid_id = sociallogin.account.uid
            user.orcid = orcid_id
            
            # ORCID provides name in the 'name' field
            name_val = None
            if 'name' in data and data['name']:
                name_val = data['name']
            elif 'first_name' in data and data['first_name']:
                name_val = data['first_name']

            if name_val is not None:
                name_parts = name_val.split(' ', 1)
                if len(name_parts) == 2:
                    user.first_name = name_parts[0]
                    user.last_name = name_parts[1]
                elif len(name_parts) == 1:
                    user.first_name = name_parts[0]

            # set username to first_name + last_name
            if user.first_name and user.last_name:
                user.username = slugify(f"{user.first_name}_{user.last_name}")
            else:
                user.username = slugify(orcid_id)  # fallback to ORCID ID as username
        
        return user
    
    def save_user(self, request, sociallogin, form=None):
        """
        Save the user and update ORCID if needed.
        """
        user = super().save_user(request, sociallogin, form)
        
        # Update ORCID if this is an ORCID login
        if sociallogin.account.provider == 'orcid' and not user.orcid:
            user.orcid = sociallogin.account.uid
            user.save()
        
        return user


class ORCIDAccountAdapter(DefaultAccountAdapter):
    def populate_username(self, request, user):
        # If username is already present, make it unique/safe here.
        if user.username:
            user.username = self.generate_unique_username([user.username])
        else:
            super().populate_username(request, user)

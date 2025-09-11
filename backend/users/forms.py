from django import forms
from .models import User
from shops.spaces import upload_profile_image, delete_object_by_url


class UserAdminForm(forms.ModelForm):
    profile_image_file = forms.ImageField(
        required=False,
        help_text="Upload a profile image; the URL field will be set automatically.")

    class Meta:
        model = User
        fields = '__all__'

    def save(self, commit=True):
        user = super().save(commit=False)
        f = self.cleaned_data.get('profile_image_file')
        if f:
            # Delete previous image best-effort
            if user.profile_image_url:
                try:
                    delete_object_by_url(user.profile_image_url)
                except Exception:
                    pass
            url = upload_profile_image(f, getattr(f, 'name', 'image'))
            user.profile_image_url = url
        if commit:
            user.save()
        return user

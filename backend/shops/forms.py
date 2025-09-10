from django import forms

from .models import ProductImage
from .spaces import upload_product_image


class ProductImageAdminForm(forms.ModelForm):
    file = forms.ImageField(required=False, help_text="Upload image; URL will be set automatically.")

    class Meta:
        model = ProductImage
        fields = ["file", "alt_text", "sort_order"]

    def clean(self):
        cleaned = super().clean()
        file_obj = cleaned.get("file")
        # If creating and no file provided, ensure existing URL (if any) remains; otherwise require a file
        if not self.instance.pk and not file_obj:
            raise forms.ValidationError("Please upload an image file.")
        return cleaned

    def save(self, commit=True):
        instance = super().save(commit=False)
        file_obj = self.cleaned_data.get("file")
        if file_obj:
            url = upload_product_image(file_obj, getattr(file_obj, "name", "image"))
            instance.url = url
        if commit:
            instance.save()
        return instance


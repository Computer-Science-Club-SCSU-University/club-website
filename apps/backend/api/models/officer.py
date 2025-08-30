from django.db import models
from .user import User


class Officer(models.Model):
    """
    Officer model for publicly displayed officers.
    Can be linked to a user account or standalone.
    """
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='officer_profile',
        db_column='user_id',
        blank=True,
        null=True,
        help_text="Optional link to user account - null for standalone officers"
    )
    name = models.CharField(
        max_length=150, 
        help_text="Display name for the officer",
        default="Officer",  
        blank=False,
        null=False
    )
    position = models.CharField(max_length=100, help_text="e.g. 'VP of Tech', 'Treasurer'")
    bio = models.TextField(blank=True, null=True)
    image_url = models.TextField(blank=True, null=True, help_text="Image URL or base64 data")  # Changed to TextField
    linkedin_url = models.URLField(blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    order_index = models.IntegerField(default=0, help_text="Used to control ordering on frontend")

    class Meta:
        db_table = 'officers'
        ordering = ['order_index', 'position']

    def __str__(self):
        return f"{self.name} - {self.position}"

    def save(self, *args, **kwargs):
        """Auto-populate name from linked user if not provided."""
        if not self.name and self.user:
            self.name = self.user.full_name
        elif not self.name:
            self.name = "Officer"
        super().save(*args, **kwargs) 
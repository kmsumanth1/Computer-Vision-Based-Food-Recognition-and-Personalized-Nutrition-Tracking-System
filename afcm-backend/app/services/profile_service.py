import datetime as dt

from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models.user import Profile, User
from app.schemas.profile import ProfileUpdate, UserProfile
from app.services import tracking_service


def get_profile(db: Session, user: User) -> Profile:
    profile = db.get(Profile, user.id)
    if profile is None:
        raise AppError(404, "PROFILE_NOT_FOUND", "Your profile hasn't been set up yet.")
    return profile


def to_schema(profile: Profile) -> UserProfile:
    return UserProfile(
        name=profile.name,
        sex=profile.sex,  # type: ignore[arg-type]
        age=profile.age,
        height_cm=profile.height_cm,
        weight_kg=profile.weight_kg,
        body_fat_percentage=profile.body_fat_percentage,
        activity_level=profile.activity_level,  # type: ignore[arg-type]
        goal=profile.goal,  # type: ignore[arg-type]
    )


def setup_profile(db: Session, user: User, data: UserProfile, today: dt.date) -> Profile:
    """Creates the profile, or replaces it if the user runs setup again."""
    profile = db.get(Profile, user.id)
    values = data.model_dump()
    if profile is None:
        profile = Profile(user_id=user.id, **values)
        db.add(profile)
    else:
        for key, value in values.items():
            setattr(profile, key, value)
    user.name = data.name
    tracking_service.record_weight(db, user.id, today, data.weight_kg)
    db.commit()
    return profile


def update_profile(db: Session, user: User, patch: ProfileUpdate, today: dt.date) -> Profile:
    profile = get_profile(db, user)
    changes = patch.model_dump(exclude_none=True)
    for key, value in changes.items():
        setattr(profile, key, value)
    if "name" in changes:
        user.name = changes["name"]
    if "weight_kg" in changes:
        tracking_service.record_weight(db, user.id, today, changes["weight_kg"])
    db.commit()
    return profile

import { getProfilesForSwipe } from "@/actions/talent";
import ProfileSwipe from "./ProfileSwipe";

export default async function TalentPage() {
  const profiles = await getProfilesForSwipe();
  return <ProfileSwipe profiles={profiles} />;
}

import { getCurrentUser } from "@/lib/data";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { ThemeToggle } from "@/components/settings/ThemeToggle";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <>
      <header className="page-head">
        <div className="page-head-text">
          <div className="overline">Account</div>
          <h1 className="page-title">Settings</h1>
        </div>
        <ThemeToggle />
      </header>

      <SettingsForm user={user} />

    </>
  );
}
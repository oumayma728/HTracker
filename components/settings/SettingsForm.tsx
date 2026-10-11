"use client";
import { useState, type FormEvent } from "react";
import type { User } from "@/lib/data";
import { saveSettings } from "@/lib/actions";

export function SettingsForm({ user }: { user: User }) {
    const [name, setName] = useState(user.name || "");
    const [email, setEmail] = useState(user.email || "");
    function handleProfileSave(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        formData.set("name", name);
        formData.set("email", email);
        saveSettings(formData);
    }

    return (
        <>
            <form className="card card-pad stack" onSubmit={handleProfileSave}>
                <h2 className="section-title">Profile</h2>
                <div className="field">
                    <label className="label" htmlFor="s-name">
                        {user.name ? "Name" : "Username"}
                    </label>
                    <input id="s-name" name="name" type="text" className="input" defaultValue={user.name} autoComplete="name" onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="field">
                    <label className="label" htmlFor="s-email">
                        {user.email ? "Email" : "Email address"}
                    </label>
                    <input id="s-email" name="email" type="email" className="input" defaultValue={user.email} autoComplete="email" onChange={(e) => setEmail(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start", padding: "0 20px" }}>
                    Save changes
                </button>
            </form>
        </>
    );
}
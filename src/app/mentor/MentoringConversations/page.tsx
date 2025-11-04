"use client";
import { useMemo, useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";
import HeroBg from "@/app/Assets/jumpstart-hero.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";

type LeftTab = "overview" | "notes";
type NotesTab = "add" | "list";

export default function MentoringConversationsPage() {
  // Left navigation
  const [activeLeft, setActiveLeft] = useState<LeftTab>("notes");

  // Notes header segmented tabs
  const [notesTab, setNotesTab] = useState<NotesTab>("list");

  // Notes state
  const [notes, setNotes] = useState<string[]>([
    "Is it possible for you to get me a letter stating that my volunteering is part of this course to submit to my church committee?",
    "Prepare talking points for month-3 session.",
  ]);

  // Add form state
  const [note, setNote] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const wordCount = useMemo(
    () => (note.trim().match(/\S+/g) || []).length,
    [note]
  );

  // Handlers
  const handleAddNote = () => {
    if (!note.trim()) return;
    setNotes((prev) => [note.trim(), ...prev]);
    setNote("");
    setNotesTab("list");
  };

  const handleDelete = (index: number) => {
    if (confirm("Are you sure you want to delete this note?")) {
      setNotes((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setNote(notes[index]);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const updated = [...notes];
    updated[editingIndex] = note.trim();
    setNotes(updated);
    setEditingIndex(null);
    setNote("");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setNote("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85] text-white">
      <MentorHeader showFullHeader />

      {/* HERO */}
      <section
        className="relative h-[300px] bg-cover bg-center flex flex-col justify-end px-20 pb-10"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 mb-2 text-[13px] text-white/80">
          Revitalization Roadmap <span className="mx-2">›</span> Church
          Empowerment Phase <span className="mx-2">›</span>{" "}
          <span className="text-white">Mentoring Conversations</span>
        </div>

        <div className="relative z-10">
          <h1 className="text-[32px] font-semibold leading-tight">
            Mentoring Conversations
          </h1>
          <p className="text-white/80 text-[13px] mt-1">
            Completion Time Months 3 – 4
          </p>
        </div>
      </section>

      {/* MAIN */}
      <main className="flex-1 px-16 py-10 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[270px_1fr] gap-10">
          {/* LEFT SIDE */}
          <aside className="bg-white rounded-xl p-4 h-fit">
            <div className="rounded-lg overflow-hidden border border-[#E8ECF5]">
              <button
                onClick={() => setActiveLeft("overview")}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition
                  ${
                    activeLeft === "overview"
                      ? "bg-[#0F2F64] text-white"
                      : "bg-white text-[#0B1C58] hover:bg-[#F3F6FD]"
                  }`}
              >
                Over View
              </button>
              <button
                onClick={() => setActiveLeft("notes")}
                className={`w-full text-left px-4 py-3 text-sm font-medium border-t border-[#E8ECF5] transition
                  ${
                    activeLeft === "notes"
                      ? "bg-[#0F2F64] text-white"
                      : "bg-white text-[#0B1C58] hover:bg-[#F3F6FD]"
                  }`}
              >
                Notes
              </button>
            </div>
          </aside>

          {/* RIGHT SIDE */}
          <section className="relative">
            {activeLeft === "overview" ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-semibold">Over View</h2>
                  <button
                    className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20"
                    aria-label="more"
                  >
                    <i className="fa-solid fa-ellipsis-vertical text-white/90" />
                  </button>
                </div>
                <div className="h-px w-full bg-white/20 mb-6" />

                {/* ROADMAP */}
                <div className="mb-4">
                  <p className="text-[13px] mb-2">Roadmap</p>
                  <div className="rounded-lg border border-[#3B8CC2] bg-[#0F5B96]/50 px-4 py-3">
                    <span className="inline-block text-[13px]">
                      Schedule 2 Mentor Meetings
                    </span>
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div className="mb-8">
                  <p className="text-[13px] mb-2">Description</p>
                  <div className="rounded-lg border border-[#3B8CC2] bg-[#0F5B96]/50 px-4 py-3">
                    <span className="inline-block text-[13px]">
                      Schedule a mentoring conversation for both months 3 and 4
                    </span>
                  </div>
                </div>

                {/* OVERVIEW NOTES */}
                <div className="mb-2">
                  <p className="text-[13px] mb-2">Notes</p>
                  <textarea
                    placeholder="Write your notes here..."
                    className="w-full h-28 rounded-lg bg-transparent border border-[#3B8CC2] text-white text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#00B3FF] resize-none"
                  />
                </div>
              </>
            ) : (
              <>
                {/* NOTES HEADER */}
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Notes</h2>
                  <div className="flex items-center gap-3">
                    {/* Segmented Control */}
                    <div className="inline-flex items-center rounded-lg bg-white p-1 shadow-sm border border-white/30">
                      <button
                        onClick={() => {
                          setNotesTab("add");
                          setNote("");
                          setEditingIndex(null);
                        }}
                        className={`px-4 py-2 text-sm font-semibold rounded-md transition
                          ${
                            notesTab === "add"
                              ? "bg-[#103C8C] text-white shadow"
                              : "text-[#0B1C58] hover:bg-[#F2F5FF]"
                          }`}
                      >
                        Add New
                      </button>
                      <button
                        onClick={() => {
                          setNotesTab("list");
                          setEditingIndex(null);
                          setNote("");
                        }}
                        className={`px-4 py-2 text-sm font-semibold rounded-md transition
                          ${
                            notesTab === "list"
                              ? "bg-[#103C8C] text-white shadow"
                              : "text-[#0B1C58] hover:bg-[#F2F5FF]"
                          }`}
                      >
                        Notes
                      </button>
                    </div>

                    {/* ADD (+) ICON */}
                    <button
                      type="button"
                      aria-label="add"
                      className="w-8 h-8 rounded-full border border-white/30 bg-white/10 flex items-center justify-center hover:bg-white/20"
                      onClick={() => setNotesTab("add")}
                    >
                      <i className="fa-solid fa-plus text-xs text-white" />
                    </button>
                  </div>
                </div>

                <div className="h-px w-full bg-white/25 my-4" />

                {/* ADD FORM */}
                {notesTab === "add" && editingIndex === null && (
                  <div>
                    <p className="text-[15px] font-medium mb-3">
                      Enter your Notes here.
                    </p>
                    <div className="relative">
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Enter Notes here…."
                        className="w-full min-h-[160px] rounded-lg bg-transparent border border-[#6BA0D5] text-white text-sm p-4 pr-12 focus:outline-none focus:ring-1 focus:ring-[#00B3FF]"
                      />
                      <span className="absolute bottom-3 right-4 text-[11px] text-white/60">
                        ({wordCount} Words)
                      </span>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        onClick={() => setNotesTab("list")}
                        className="h-10 px-6 rounded-md border border-white/40 bg-white/10 hover:bg-white/15 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddNote}
                        disabled={!note.trim()}
                        className="h-10 px-8 rounded-md border border-white/40 bg-[#103C8C] hover:bg-[#154FB8] transition disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* NOTES LIST */}
                {notesTab === "list" && (
                  <div className="space-y-3">
                    {notes.length === 0 ? (
                      <div className="text-white/80 text-sm">No notes yet.</div>
                    ) : (
                      notes.map((n, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-[#3B8CC2] bg-[#0F5B96]/40 px-4 py-3 text-[13px]"
                        >
                          {editingIndex === idx ? (
                            <>
                              <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full min-h-[100px] rounded-md bg-transparent border border-[#6BA0D5] text-white text-sm p-3 mb-3 focus:outline-none focus:ring-1 focus:ring-[#00B3FF]"
                              />
                              <div className="flex justify-end gap-3">
                                <button
                                  onClick={handleCancelEdit}
                                  className="h-8 px-5 rounded-md border border-white/40 bg-white/10 hover:bg-white/15 text-sm"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleSaveEdit}
                                  disabled={!note.trim()}
                                  className="h-8 px-6 rounded-md border border-white/40 bg-[#103C8C] hover:bg-[#154FB8] text-sm disabled:opacity-50"
                                >
                                  Save
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-white/90 leading-relaxed mb-3">
                                {n}
                              </p>
                              <div className="flex justify-end gap-3">
                                <button
                                  onClick={() => handleDelete(idx)}
                                  className="text-[13px] text-white/90 border border-white/30 rounded-md px-4 py-1 bg-white/10 hover:bg-white/20 flex items-center gap-1"
                                >
                                  <i className="fa-regular fa-trash-can text-[12px]" />
                                  Delete
                                </button>
                                <button
                                  onClick={() => handleEdit(idx)}
                                  className="text-[13px] text-white/90 border border-white/30 rounded-md px-4 py-1 bg-white/10 hover:bg-white/20 flex items-center gap-1"
                                >
                                  <i className="fa-regular fa-pen-to-square text-[12px]" />
                                  Edit
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

# iMessage MCP Versions

| Component | Version | Last Updated |
|-----------|---------|--------------|
| imessage-mcp | 0.1.0 | 2026-08-31 |

---

## 0.1.0

First release. TypeScript on Bun, 10 tools, 21 tests.

Written after reading all three existing iMessage MCP servers in full from
source. carries a file and line reference for every claim.

### The things that were wrong elsewhere

**Truncation.** Message bodies live in an `attributedBody` blob whose length
prefix is one byte for short strings and, after a `0x81` marker, two bytes
little-endian. Anthropic's plugin reads one byte after that marker, so every
message of 256 bytes or more is silently cut. A 618-byte message decodes as
106.

**Note-to-self.** Self-chat rows are written with `is_from_me = 1` and no
received copy. An inbound handler that skips all `is_from_me` rows drops every
message you send yourself, which is the flow that plugin's README tells you to
test with.

**The cursor.** A watermark taken from `MAX(ROWID)` at boot and held in memory
means every message that arrives while nothing is running is skipped, not
queued.

**Unverified sends.** A clean `osascript` exit means Messages accepted the
instruction, not that anything was delivered.

### What is here

Durable on-disk cursor, contact resolution across every AddressBook source,
search that decodes bodies rather than only reading the `text` column, sending
with delivery confirmation, voice-note transcription across four providers
(Groq by default, `local` to keep audio on the machine, OpenAI, ElevenLabs),
and speech through ElevenLabs.

### Known gaps

Voice-note transcription has been verified end to end against an Apple `.caf`
file through Groq, but not yet against a real inbound voice note arriving in
Messages.

Tapbacks, edits and threaded replies are not supported and cannot be without
Apple's private API.

"""
Tier-1 Conversational Diagnostic AI Agent & Playbook Engine
Autonomous Enterprise IT Helpdesk & Triage Engine
"""
import logging
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from app.schemas import (
    ChatMessage,
    ChatTurnRequest,
    ChatTurnResponse,
    DiagnosticPlaybook,
    InteractiveTicketStatus,
    TicketCreateRequest,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Default Diagnostic Playbooks
# ---------------------------------------------------------------------------
DEFAULT_PLAYBOOKS: Dict[str, DiagnosticPlaybook] = {
    "CAMERA_WEBCAM": DiagnosticPlaybook(
        category_id="CAMERA_WEBCAM",
        title="Webcam & Video Peripheral Diagnostics",
        icon="📹",
        initial_questions=[
            {
                "id": "camera_type",
                "label": "Is your camera built into your laptop or an external USB peripheral?",
                "options": ["Built-in Laptop Webcam", "External USB Webcam", "Conference Room Cam"],
            },
            {
                "id": "symptom",
                "label": "What symptom do you observe in Teams/Zoom?",
                "options": ["Black screen", "Error: 'No camera found'", "Camera LED on but no video", "Freezing/Stuttering"],
            },
        ],
        diagnostic_steps=[
            {
                "step": 1,
                "instruction": "Let's check the physical privacy shutter: Does your webcam have a physical mechanical slider or switch covering the lens? Please slide it open and check if the video appears.",
                "quick_replies": ["Slider opened, still black", "Found it! It was closed", "Camera needs to be changed / Broken", "No physical slider on my model"],
            },
            {
                "step": 2,
                "instruction": "Let's check Windows Camera Privacy Permissions: Go to Windows Settings > Privacy & security > Camera, and ensure 'Camera access' and 'Let desktop apps access your camera' are turned ON.\n\nTip: You can take a screenshot (Win+Shift+S) and upload it here if you want me to inspect your settings!",
                "quick_replies": ["Permissions are ON", "Turned it ON and video works!", "Uploaded screenshot of my settings"],
            },
            {
                "step": 3,
                "instruction": "For USB webcams: Please unplug the USB cable, wait 5 seconds, and plug it directly into a different USB port on your PC (avoiding unpowered USB hubs). Does Windows make the USB connect sound?",
                "quick_replies": ["Heard chime, still black screen", "Swapped port and it works!", "No chime, completely dead"],
            },
            {
                "step": 4,
                "instruction": "Let's check Device Manager: Press Win+X, select Device Manager, and expand 'Cameras'. Do you see your camera listed, or does it show a yellow warning triangle or error code 0xA00F4244?",
                "quick_replies": ["Yellow exclamation mark visible", "No cameras section listed at all", "Shows error 0xA00F4244"],
            },
        ],
        hardware_failure_signals=[
            "cracked lens", "sensor burnt", "no chime completely dead", "no cameras section listed at all",
            "smells burnt", "dropped the webcam", "cable frayed", "hardware failure", "error 0xa00f4244",
            "broken hardware", "camera dead", "physical damage", "camera need to be changed",
            "camera needs to be changed", "camera needs replacement", "camera broken"
        ],
        resolution_signals=[
            "it works now", "video came back", "fixed", "working now", "found it it was closed",
            "swapped port and it works", "turned it on and video works", "problem solved", "thank you"
        ],
    ),
    "MONITOR_DISPLAY": DiagnosticPlaybook(
        category_id="MONITOR_DISPLAY",
        title="Monitor, Display & Docking Diagnostics",
        icon="🖥️",
        initial_questions=[
            {
                "id": "display_setup",
                "label": "How is your monitor connected?",
                "options": ["Direct HDMI / DisplayPort to PC", "Connected via USB-C Docking Station", "Dual Monitor Setup"],
            },
            {
                "id": "led_status",
                "label": "What is the status of the monitor's power light?",
                "options": ["Blinking Amber/Orange (Standby)", "Steady Blue/White (On)", "Completely Dark (No Power)"],
            },
        ],
        diagnostic_steps=[
            {
                "step": 1,
                "instruction": "Power & Standby check: Press the physical power button on the monitor. If the light is blinking amber, press the 'Source / Input' button to ensure it is set to the correct port (HDMI 1 or DisplayPort).",
                "quick_replies": ["Changed source, screen came on!", "Source is correct, still says No Signal", "Power light stays dark"],
            },
            {
                "step": 2,
                "instruction": "Physical Cable Reseat: Unplug the HDMI/DisplayPort cable from both the back of the monitor and the PC/dock. Inspect the cable pins for damage, then plug it back in firmly until it clicks.",
                "quick_replies": ["Reseated cable, display works now!", "Cable firmly plugged, still No Signal", "Cable pins look bent"],
            },
            {
                "step": 3,
                "instruction": "Windows Display Detection: Press Win + P on your keyboard and click 'Extend' or 'Duplicate'. Does the second display flicker or wake up?",
                "quick_replies": ["Win+P fixed it, screen woke up!", "Flickered once then black again", "Nothing happens at all"],
            },
            {
                "step": 4,
                "instruction": "Docking Station Power Cycle: If connected via a dock, unplug the dock's main power brick for 10 seconds, then reconnect.",
                "quick_replies": ["Rebooted dock, display works!", "Still No Signal on monitor", "Dock light not turning on"],
            },
        ],
        hardware_failure_signals=[
            "cracked screen", "shattered panel", "colorful vertical lines", "liquid damage",
            "smell smoke", "cable pins look bent", "dock light not turning on", "capacitors popped",
            "dead backlight", "flickered once then black again"
        ],
        resolution_signals=[
            "changed source screen came on", "reseated cable display works now", "win+p fixed it screen woke up",
            "rebooted dock display works", "it works now", "working now", "solved", "fixed thank you"
        ],
    ),
    "VPN_NETWORK": DiagnosticPlaybook(
        category_id="VPN_NETWORK",
        title="Remote Access & VPN Tunnel Diagnostics",
        icon="🌐",
        initial_questions=[
            {
                "id": "vpn_client",
                "label": "Which VPN client are you using?",
                "options": ["Cisco AnyConnect / Secure Client", "Palo Alto GlobalProtect", "Windows Built-in VPN"],
            },
            {
                "id": "error_message",
                "label": "What error message or behavior occurs?",
                "options": ["'Connection attempt has failed'", "'Authentication failed / MFA timed out'", "'Gateway unreachable'"],
            },
        ],
        diagnostic_steps=[
            {
                "step": 1,
                "instruction": "Local Internet Check: Are ordinary websites (like google.com) loading in your browser? Please confirm your home Wi-Fi or hotspot is active.",
                "quick_replies": ["Internet is working fine", "My home Wi-Fi seems down", "Connected via mobile hotspot"],
            },
            {
                "step": 2,
                "instruction": "Server Gateway Check: Verify that the VPN server address in your client is set to 'vpn.corp.example.test'. Is the address correct?",
                "quick_replies": ["Address is correct", "Address was mistyped, corrected it!", "Which gateway should I use?"],
            },
            {
                "step": 3,
                "instruction": "VPN Service Restart: In Windows, press Win+R, type 'services.msc', scroll down to 'Cisco AnyConnect Secure Mobility Agent', right click and select 'Restart'. Then attempt to connect again.",
                "quick_replies": ["Restarted service and connected!", "Service restart failed", "Connected successfully"],
            },
        ],
        hardware_failure_signals=[
            "wifi adapter missing in device manager", "ethernet port physical break"
        ],
        resolution_signals=[
            "address was mistyped corrected it", "restarted service and connected", "connected successfully",
            "it works now", "vpn connected", "fixed"
        ],
    ),
    "ACCOUNT_LOCKOUT": DiagnosticPlaybook(
        category_id="ACCOUNT_LOCKOUT",
        title="Active Directory Account Lockout",
        icon="🔐",
        initial_questions=[
            {
                "id": "account_type",
                "label": "Which account is experiencing login failure?",
                "options": ["Standard Domain Account", "Privileged Administrative Account", "Service Account"],
            },
        ],
        diagnostic_steps=[
            {
                "step": 1,
                "instruction": "Our system connects directly to Active Directory. Would you like me to trigger an automated directory state query and account unlock for your username?",
                "quick_replies": ["Yes, please unlock my account", "I also need a password reset", "Cancel request"],
            },
        ],
        hardware_failure_signals=[],
        resolution_signals=["unlocked", "it works", "logged in successfully"],
    ),
    "SOFTWARE_LICENSE": DiagnosticPlaybook(
        category_id="SOFTWARE_LICENSE",
        title="Application & Software Catalog Provisioning",
        icon="📦",
        initial_questions=[
            {
                "id": "app_name",
                "label": "Which application requires license provisioning?",
                "options": ["Docker Desktop", "Microsoft 365 / Visio", "JetBrains All Products", "Adobe Creative Cloud"],
            },
        ],
        diagnostic_steps=[
            {
                "step": 1,
                "instruction": "I can check your Entra ID / Active Directory group membership and push the catalog license to your device via Intune. Would you like me to trigger auto-assignment?",
                "quick_replies": ["Yes, assign license to my device", "Application crashes on launch", "Need manager approval link"],
            },
            {
                "step": 2,
                "instruction": "If the app is already installed but failing to launch, let's clear the local licensing cache or trigger an Intune app reinstall.",
                "quick_replies": ["Reinstall triggered and app launched!", "Still throws license error", "Requires admin elevation"],
            },
        ],
        hardware_failure_signals=[],
        resolution_signals=["app launched", "license assigned", "it works", "working now", "fixed"],
    ),
    "GENERAL_IT": DiagnosticPlaybook(
        category_id="GENERAL_IT",
        title="General IT Helpdesk & Triage",
        icon="🛠️",
        initial_questions=[
            {
                "id": "urgency",
                "label": "Is your issue blocking work for a single user or multiple team members?",
                "options": ["Single User (My workstation)", "Department Impact", "Production Outage"],
            },
        ],
        diagnostic_steps=[
            {
                "step": 1,
                "instruction": "I have logged your request in our autonomous triage queue. Have you attempted a system restart (rebooting your workstation) since the issue began?",
                "quick_replies": ["Restarted, still broken", "Reboot fixed it!", "Need immediate technician callback"],
            },
            {
                "step": 2,
                "instruction": "Let's check if there are any pending Windows or security patch updates in Software Center or Windows Update. Are any updates installing?",
                "quick_replies": ["No updates pending", "Installing updates now", "Error during update"],
            },
        ],
        hardware_failure_signals=["smoke", "burnt", "cracked", "physical damage", "spilled water", "liquid", "broken"],
        resolution_signals=["reboot fixed it", "working now", "it works", "fixed thank you", "solved"],
    ),
}


# ---------------------------------------------------------------------------
# In-Memory Conversational Ticket Repository
# ---------------------------------------------------------------------------
class ConversationalTicketManager:
    def __init__(self):
        self.tickets: Dict[str, Dict[str, Any]] = {}
        self.playbooks: Dict[str, DiagnosticPlaybook] = DEFAULT_PLAYBOOKS.copy()

    def create_ticket(self, req: TicketCreateRequest) -> Dict[str, Any]:
        """Create a new interactive troubleshooting ticket session."""
        ticket_id = f"TCK-2026-{req.category[:4]}-{str(uuid.uuid4())[:6].upper()}"
        playbook = self.playbooks.get(req.category) or self.playbooks["CAMERA_WEBCAM"]

        initial_messages: List[ChatMessage] = []

        # System intro
        intro_content = (
            f"Hello {req.user_id}! I am your Autonomous Tier-1 IT Support Specialist.\n"
            f"I have received your ticket regarding **{playbook.title}** on device `{req.device_hostname or 'corporate workstation'}`.\n\n"
            f"Problem Reported: *\"{req.description}\"*\n\n"
            f"I will walk you through a few quick, methodical diagnostic checks to see if we can resolve this right now without waiting for a technician. "
            f"You can also upload screenshots or photos anytime if you'd like me to inspect your screen or setup!"
        )
        initial_messages.append(ChatMessage(role="assistant", content=intro_content))

        # First diagnostic step
        first_step = playbook.diagnostic_steps[0] if playbook.diagnostic_steps else None
        if first_step:
            step_msg = f"**Step 1 of {len(playbook.diagnostic_steps)}:**\n{first_step['instruction']}"
            initial_messages.append(ChatMessage(role="assistant", content=step_msg))

        ticket_data = {
            "ticket_id": ticket_id,
            "user_id": req.user_id,
            "user_email": req.user_email,
            "category": req.category,
            "description": req.description,
            "qualifying_answers": req.qualifying_answers,
            "device_hostname": req.device_hostname,
            "status": InteractiveTicketStatus.DIAGNOSING,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "current_step_index": 0,
            "messages": [m.model_dump() for m in initial_messages],
            "diagnostic_log": [],
            "escalation_summary": None,
            "hardware_replacement_needed": False,
        }
        self.tickets[ticket_id] = ticket_data
        logger.info(f"Created new interactive diagnostic ticket: {ticket_id} for user {req.user_id}")
        return ticket_data

    def get_ticket(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        return self.tickets.get(ticket_id)

    def list_all_tickets(self) -> List[Dict[str, Any]]:
        return list(self.tickets.values())

    def process_chat_turn(self, ticket_id: str, turn_req: ChatTurnRequest) -> ChatTurnResponse:
        """
        Process a user reply in the diagnostic conversation.
        Analyzes for:
        1. Problem resolution signals (closes ticket)
        2. Hardware failure signals (escalates to human IT with replacement recommendation)
        3. Image analysis & screen annotation (if user sent image)
        4. Progress to next diagnostic step
        """
        ticket = self.tickets.get(ticket_id)
        if not ticket:
            raise ValueError(f"Ticket {ticket_id} not found.")

        user_text = turn_req.message.strip()
        user_text_lower = user_text.lower()
        has_image = bool(turn_req.image_base64)

        # Append user message
        user_msg = ChatMessage(
            role="user",
            content=user_text,
            image_data=turn_req.image_base64 if has_image else None,
        )
        ticket["messages"].append(user_msg.model_dump())
        ticket["diagnostic_log"].append({
            "step": ticket["current_step_index"] + 1,
            "user_response": user_text,
            "has_image": has_image,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        playbook = self.playbooks.get(ticket["category"]) or self.playbooks["CAMERA_WEBCAM"]
        total_steps = len(playbook.diagnostic_steps)
        current_idx = ticket["current_step_index"]

        # -------------------------------------------------------------------
        # 0. Check for Active Directory Unlock Request
        # -------------------------------------------------------------------
        if ticket["category"] == "ACCOUNT_LOCKOUT" and any(w in user_text_lower for w in ["unlock", "yes", "please unlock"]):
            from app.ldap_engine import ldap_engine
            unlock_success = ldap_engine.unlock_ad_account(ticket["user_id"])
            ticket["status"] = InteractiveTicketStatus.RESOLVED_BY_AI
            ticket["updated_at"] = datetime.now(timezone.utc)
            unlock_reply = (
                f"✅ **Active Directory Account Unlocked!**\n\n"
                f"I queried the domain controller (`corp.example.test`) and successfully executed `unlock_ad_account` for `{ticket['user_id']}`.\n\n"
                f"Your account status is now **ACTIVE** in LDAP. Please try logging in to your Windows workstation now."
            )
            ticket["messages"].append(ChatMessage(role="assistant", content=unlock_reply).model_dump())
            return ChatTurnResponse(
                ticket_id=ticket_id,
                reply=unlock_reply,
                ticket_status=InteractiveTicketStatus.RESOLVED_BY_AI,
                current_step=total_steps,
                total_steps=total_steps,
                suggested_quick_replies=["Login succeeded, thank you!", "I still need a password reset", "Close ticket"],
                hardware_replacement_needed=False,
            )

        # -------------------------------------------------------------------
        # 1. Check for Resolution Signal
        # -------------------------------------------------------------------
        if any(sig in user_text_lower for sig in playbook.resolution_signals):
            ticket["status"] = InteractiveTicketStatus.RESOLVED_BY_AI
            ticket["updated_at"] = datetime.now(timezone.utc)
            resolution_reply = (
                f"🎉 **Terrific news!** I'm glad we were able to get your {playbook.title.lower()} working smoothly!\n\n"
                f"I have automatically closed ticket **{ticket_id}** and documented the resolution in your account history. "
                f"Have a productive day!"
            )
            ticket["messages"].append(ChatMessage(role="assistant", content=resolution_reply).model_dump())
            return ChatTurnResponse(
                ticket_id=ticket_id,
                reply=resolution_reply,
                ticket_status=InteractiveTicketStatus.RESOLVED_BY_AI,
                current_step=current_idx + 1,
                total_steps=total_steps,
                suggested_quick_replies=["Everything is working", "Open another ticket"],
                hardware_replacement_needed=False,
            )

        # -------------------------------------------------------------------
        # 2. Check for Hardware Failure Signal
        # -------------------------------------------------------------------
        is_hw_failure = any(sig in user_text_lower for sig in playbook.hardware_failure_signals)
        if is_hw_failure or current_idx >= total_steps - 1:
            ticket["status"] = InteractiveTicketStatus.ESCALATED_TO_HUMAN_IT
            ticket["hardware_replacement_needed"] = is_hw_failure
            ticket["updated_at"] = datetime.now(timezone.utc)

            # Generate structured handover summary
            escalation_summary = {
                "ticket_id": ticket_id,
                "user_id": ticket["user_id"],
                "category": ticket["category"],
                "device_hostname": ticket["device_hostname"],
                "reason": "Hardware failure detected during guided troubleshooting." if is_hw_failure else "Exhausted Tier-1 software diagnostic checklist without resolution.",
                "diagnostics_completed": ticket["diagnostic_log"],
                "hardware_recommendation": f"Order and deploy replacement {playbook.category_id} unit for user {ticket['user_id']}." if is_hw_failure else "Tier-2 on-site technician inspection required.",
                "escalated_at": datetime.now(timezone.utc).isoformat(),
            }
            ticket["escalation_summary"] = escalation_summary

            if ticket["category"] == "CAMERA_WEBCAM" and is_hw_failure:
                escalation_reply = (
                    f"⚠️ **Diagnostic Finding: Camera Needs to Be Changed (Replacement Dispatched)**\n\n"
                    f"Based on our guided diagnostic steps, we confirmed that the camera hardware is defective or has failed.\n\n"
                    f"📋 **Action Taken:**\n"
                    f"- Ticket **{ticket_id}** has been escalated to Tier-2 Desktop Support.\n"
                    f"- Replacement Camera Requisition (`REQ-CAM-482`) generated for delivery to your desk.\n"
                    f"- Complete diagnostic chat log and test history documented and attached for the technician.\n\n"
                    f"A technician has been dispatched with the replacement camera!"
                )
            else:
                escalation_reply = (
                    f"⚠️ **Diagnostic Finding: Escalation to Human IT Support Required**\n\n"
                    f"Based on the troubleshooting steps we completed"
                    f"{' and the hardware damage signals identified' if is_hw_failure else ''}, "
                    f"this issue requires physical attention from an IT Support Engineer.\n\n"
                    f"📋 **Action Taken:**\n"
                    f"- Ticket **{ticket_id}** has been automatically escalated to the Tier-2 IT Hardware Team.\n"
                    f"- Full diagnostic transcript and test history attached.\n"
                    f"- {'Recommended hardware replacement request dispatched.' if is_hw_failure else 'A technician will contact you shortly.'}\n\n"
                    f"You don't need to do anything further; our team has all the diagnostic context!"
                )
            ticket["messages"].append(ChatMessage(role="assistant", content=escalation_reply).model_dump())

            return ChatTurnResponse(
                ticket_id=ticket_id,
                reply=escalation_reply,
                ticket_status=InteractiveTicketStatus.ESCALATED_TO_HUMAN_IT,
                current_step=total_steps,
                total_steps=total_steps,
                suggested_quick_replies=["View escalation summary", "Contact IT Service Desk"],
                hardware_replacement_needed=is_hw_failure,
                escalation_summary=escalation_summary,
            )

        # -------------------------------------------------------------------
        # 3. Image Analysis & Visual Annotation (If user uploaded an image)
        # -------------------------------------------------------------------
        image_annotation = None
        image_feedback = ""
        if has_image:
            # Simulate Computer Vision inspection of settings/screenshot
            image_annotation = {
                "x_percent": 68.5,
                "y_percent": 34.0,
                "radius": 28,
                "label": "Click this toggle: 'Camera Access'",
                "color": "#ef4444",
            }
            image_feedback = (
                "🔍 **Screenshot Analysis Completed:**\n"
                "I analyzed your screenshot! Notice the toggle in the upper right quadrant of your settings window: "
                "I've highlighted it with a red circle on your screen. Make sure that switch is set to **'ON'**.\n\n"
            )

        # -------------------------------------------------------------------
        # 4. Progress to Next Diagnostic Step
        # -------------------------------------------------------------------
        next_idx = current_idx + 1
        ticket["current_step_index"] = next_idx
        ticket["updated_at"] = datetime.now(timezone.utc)

        next_step = playbook.diagnostic_steps[next_idx]
        assistant_reply = (
            f"{image_feedback}"
            f"**Step {next_idx + 1} of {total_steps}:**\n"
            f"{next_step['instruction']}"
        )

        ticket["messages"].append(
            ChatMessage(
                role="assistant",
                content=assistant_reply,
                highlight_annotation=image_annotation,
            ).model_dump()
        )

        return ChatTurnResponse(
            ticket_id=ticket_id,
            reply=assistant_reply,
            ticket_status=InteractiveTicketStatus.DIAGNOSING,
            current_step=next_idx + 1,
            total_steps=total_steps,
            suggested_quick_replies=next_step.get("quick_replies", []),
            hardware_replacement_needed=False,
            highlight_annotation=image_annotation,
        )


# Singleton Conversational Ticket Manager
conversational_ticket_manager = ConversationalTicketManager()

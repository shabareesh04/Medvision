import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin, Search, Phone, Star, ExternalLink, X,
  ChevronRight, Award, Clock, Home, Filter, RotateCcw, Eye, Compass,
  Calendar, CheckCircle, Video, User, Check, Printer, Trash2
} from "lucide-react";
import { KARNATAKA_CITIES, KARNATAKA_CITY_COORDINATES, SPECIALITIES, REAL_DOCTORS, TOP_HOSPITALS, USER_COLLEGE_LOCATION } from "./data/doctorsData";

// ==================== IN-APP APPOINTMENT BOOKING SYSTEM ====================
function AppointmentBookingModal({ doctor, isOpen, onClose, onBookingSuccess }) {
  if (!isOpen || !doctor) return null;

  const [step, setStep] = useState("form"); // "form" | "success"
  const [consultationType, setConsultationType] = useState("In-Clinic Visit");
  
  const now = new Date();
  const [appointmentDay, setAppointmentDay] = useState(String(now.getDate()).padStart(2, "0"));
  const [appointmentMonth, setAppointmentMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [appointmentYear, setAppointmentYear] = useState(String(now.getFullYear()));
  const [selectedTime, setSelectedTime] = useState("10:30 AM");
  
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("7022698509");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("Male");
  const [symptoms, setSymptoms] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Twilio SMS Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpFeedback, setOtpFeedback] = useState({ type: "", message: "" });

  const handleSendOtp = async () => {
    if (!patientPhone.trim()) {
      alert("Please enter a valid mobile number.");
      return;
    }
    setIsSendingOtp(true);
    setOtpFeedback({ type: "info", message: "Sending Twilio verification SMS..." });
    try {
      const res = await fetch("/api/appointments/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: patientPhone }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setOtpSent(true);
        setOtpFeedback({ type: "success", message: `Twilio OTP sent to ${data.to || patientPhone}. Check your SMS!` });
      } else {
        setOtpFeedback({ type: "error", message: data.message || "Failed to send SMS." });
      }
    } catch (err) {
      setOtpFeedback({ type: "error", message: "Network error sending Twilio SMS." });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim() || otpCode.length < 4) {
      alert("Please enter the 6-digit verification code received on your phone.");
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const res = await fetch("/api/appointments/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: patientPhone, code: otpCode }),
      });
      const data = await res.json();
      if (data.status === "success" && data.valid) {
        setIsPhoneVerified(true);
        setOtpFeedback({ type: "success", message: "✓ Mobile number successfully verified via Twilio!" });
      } else {
        setOtpFeedback({ type: "error", message: data.message || "Invalid or expired code. Please try again." });
      }
    } catch (err) {
      setOtpFeedback({ type: "error", message: "Verification check failed." });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const timeSlots = [
    { label: "09:30 AM" },
    { label: "10:30 AM" },
    { label: "11:45 AM" },
    { label: "02:00 PM" },
    { label: "03:30 PM" },
    { label: "04:45 PM" },
    { label: "06:00 PM" },
    { label: "07:15 PM" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim() || !patientEmail.trim()) {
      alert("Please fill in your name, mobile number, and email.");
      return;
    }
    if (!isPhoneVerified) {
      alert("Please verify your mobile number with the Twilio SMS code before confirming the appointment.");
      if (!otpSent) handleSendOtp();
      return;
    }

    setIsSubmitting(true);
    const bookingId = `MV-APT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const newBooking = {
      id: bookingId,
      booking_id: bookingId,
      doctor_id: doctor.id || "doc-general",
      doctor_name: doctor.name || doctor.hospital,
      speciality: doctor.speciality || "General Medicine",
      hospital: doctor.hospital || "Hospital Campus",
      hospital_address: doctor.address || doctor.location || "",
      consultation_type: consultationType,
      appointment_date: `${appointmentDay}/${appointmentMonth}/${appointmentYear}`,
      appointment_time: selectedTime,
      fee: doctor.fee || 600,
      patient_name: patientName,
      patient_phone: patientPhone,
      patient_email: patientEmail,
      patient_age: patientAge,
      patient_gender: patientGender,
      symptoms: symptoms || "General Consultation",
      status: "Confirmed",
      is_phone_verified: true,
      booked_at: new Date().toISOString(),
    };

    try {
      const existing = JSON.parse(localStorage.getItem("medivision_appointments") || "[]");
      existing.unshift(newBooking);
      localStorage.setItem("medivision_appointments", JSON.stringify(existing));
    } catch (err) {
      console.warn("Could not save to localStorage:", err);
    }

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBooking),
      });
      const data = await res.json();
      if (data && data.sms_notification) {
        newBooking.sms_notification = data.sms_notification;
      }
    } catch (err) {
      console.warn("Backend API not reachable, saved locally:", err);
    }

    setIsSubmitting(false);
    setConfirmedBooking(newBooking);
    setStep("success");
    if (onBookingSuccess) onBookingSuccess(newBooking);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl bg-[#0d1b30] border border-slate-700 shadow-2xl text-white">
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-slate-800 bg-[#0d1b30]/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-xl shadow">
              📅
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {step === "success" ? "Appointment Confirmed" : "Book Doctor Appointment"}
              </h2>
              <p className="text-xs text-blue-400 font-medium">
                {doctor.name} • {doctor.speciality || "Specialist"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "form" ? (
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Doctor info summary bar */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <div className="min-w-0">
                <p className="font-bold text-slate-200 truncate">{doctor.hospital}</p>
                <p className="text-slate-400 truncate">{doctor.address || doctor.location || doctor.city}</p>
              </div>
              <div className="text-right shrink-0 ml-3">
                <span className="text-[10px] uppercase font-bold text-slate-400">Consultation Fee</span>
                <p className="text-base font-black text-emerald-400">₹{doctor.fee || 600}</p>
              </div>
            </div>

            {/* Mode: In-clinic or Video */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Consultation Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConsultationType("In-Clinic Visit")}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    consultationType === "In-Clinic Visit"
                      ? "border-blue-500 bg-blue-600/20 text-white shadow-md shadow-blue-600/20"
                      : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-700"
                  }`}
                >
                  🏥 In-Clinic Hospital Visit
                </button>
                <button
                  type="button"
                  onClick={() => setConsultationType("Online Video Call")}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    consultationType === "Online Video Call"
                      ? "border-emerald-500 bg-emerald-600/20 text-white shadow-md shadow-emerald-600/20"
                      : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-700"
                  }`}
                >
                  <Video className="h-4 w-4 text-emerald-400" />
                  💻 Online Video Consult
                </button>
              </div>
            </div>

            {/* Date Selection in Day, Month, Year Format */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Appointment Date (Day, Month, Year)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-lg border border-blue-500/20">
                    {appointmentDay}/{appointmentMonth}/{appointmentYear}
                  </span>
                  <label className="cursor-pointer text-slate-400 hover:text-white" title="Choose from calendar">
                    <Calendar className="h-4 w-4 text-blue-400 hover:scale-110 transition-transform" />
                    <input
                      type="date"
                      value={`${appointmentYear}-${appointmentMonth}-${appointmentDay}`}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={e => {
                        if (e.target.value) {
                          const [y, m, d] = e.target.value.split("-");
                          setAppointmentYear(y);
                          setAppointmentMonth(m);
                          setAppointmentDay(d);
                        }
                      }}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Day Input */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Day (DD)
                  </label>
                  <select
                    value={appointmentDay}
                    onChange={e => setAppointmentDay(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-blue-500 text-sm font-semibold text-white focus:outline-none cursor-pointer"
                  >
                    {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0")).map(d => (
                      <option key={d} value={d} className="bg-[#0d1b30] text-white">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Month Input */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Month (MM)
                  </label>
                  <select
                    value={appointmentMonth}
                    onChange={e => setAppointmentMonth(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-blue-500 text-sm font-semibold text-white focus:outline-none cursor-pointer"
                  >
                    {[
                      { num: "01", name: "01 - January" },
                      { num: "02", name: "02 - February" },
                      { num: "03", name: "03 - March" },
                      { num: "04", name: "04 - April" },
                      { num: "05", name: "05 - May" },
                      { num: "06", name: "06 - June" },
                      { num: "07", name: "07 - July" },
                      { num: "08", name: "08 - August" },
                      { num: "09", name: "09 - September" },
                      { num: "10", name: "10 - October" },
                      { num: "11", name: "11 - November" },
                      { num: "12", name: "12 - December" },
                    ].map(m => (
                      <option key={m.num} value={m.num} className="bg-[#0d1b30] text-white">
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year Input */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Year (YYYY)
                  </label>
                  <select
                    value={appointmentYear}
                    onChange={e => setAppointmentYear(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-blue-500 text-sm font-semibold text-white focus:outline-none cursor-pointer"
                  >
                    {["2026", "2027"].map(y => (
                      <option key={y} value={y} className="bg-[#0d1b30] text-white">
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                <span className="text-blue-400">📅</span> Selected Date: <strong className="text-white font-mono">{appointmentDay}/{appointmentMonth}/{appointmentYear}</strong> (Day, Month, Year)
              </p>
            </div>

            {/* Time Slot Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Select Time Slot
              </label>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map(slot => (
                  <button
                    key={slot.label}
                    type="button"
                    onClick={() => setSelectedTime(slot.label)}
                    className={`py-2 px-1 text-center rounded-xl border text-xs transition-all cursor-pointer ${
                      selectedTime === slot.label
                        ? "border-blue-500 bg-blue-600 text-white font-bold shadow-sm"
                        : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Patient Information */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Patient Information
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    placeholder="Patient Full Name *"
                    required
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-blue-500 text-sm text-white placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
                <div>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      placeholder="Mobile Number (e.g. 7022698509) *"
                      required
                      value={patientPhone}
                      onChange={e => {
                        setPatientPhone(e.target.value);
                        setIsPhoneVerified(false);
                        setOtpSent(false);
                      }}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-blue-500 text-sm text-white placeholder:text-slate-500 focus:outline-none"
                    />
                    {isPhoneVerified ? (
                      <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-xs whitespace-nowrap">
                        ✓ Verified
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all whitespace-nowrap disabled:opacity-50 cursor-pointer shadow-sm"
                      >
                        {isSendingOtp ? "Sending..." : otpSent ? "Resend OTP" : "Send Twilio OTP"}
                      </button>
                    )}
                  </div>
                  {/* Twilio Verification OTP Box */}
                  {otpSent && !isPhoneVerified && (
                    <div className="mt-2.5 p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-300">
                          Twilio SMS Verification Code:
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          to +91 {patientPhone}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Enter 6-digit code"
                          value={otpCode}
                          onChange={e => setOtpCode(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 focus:border-blue-500 text-center text-sm font-mono tracking-widest text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={isVerifyingOtp}
                          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs whitespace-nowrap transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                        >
                          {isVerifyingOtp ? "Checking..." : "Verify OTP"}
                        </button>
                      </div>
                      {otpFeedback.message && (
                        <p className={`text-[11px] ${otpFeedback.type === "error" ? "text-rose-400" : "text-emerald-300"}`}>
                          {otpFeedback.message}
                        </p>
                      )}
                    </div>
                  )}
                  {isPhoneVerified && (
                    <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                      <span>✓</span> Phone verified with Twilio SMS (+91 {patientPhone})
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Email Address *"
                    required
                    value={patientEmail}
                    onChange={e => setPatientEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-blue-500 text-sm text-white placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Age"
                    value={patientAge}
                    onChange={e => setPatientAge(e.target.value)}
                    className="w-1/2 px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-blue-500 text-sm text-white placeholder:text-slate-500 focus:outline-none"
                  />
                  <select
                    value={patientGender}
                    onChange={e => setPatientGender(e.target.value)}
                    className="w-1/2 px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-blue-500 text-sm text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <textarea
                placeholder="Reason for consultation or symptoms (optional)"
                rows={2}
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-blue-500 text-sm text-white placeholder:text-slate-500 focus:outline-none resize-none"
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Processing Appointment...</span>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" />
                    Confirm Appointment • ₹{doctor.fee || 600}
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-slate-500 mt-2">
                🔒 Free cancellation up to 2 hours before the scheduled slot. Pay at clinic or online.
              </p>
            </div>
          </form>
        ) : (
          /* Confirmation Screen */
          <div className="p-6 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-emerald-500/20">
              ✓
            </div>
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 mb-2">
                Booking Confirmed
              </span>
              <h3 className="text-xl font-black text-white">Your Appointment is Scheduled!</h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Booking ID: <strong className="text-blue-400">{confirmedBooking?.booking_id}</strong>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-left space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Doctor:</span>
                <span className="font-bold text-white">{confirmedBooking?.doctor_name} ({confirmedBooking?.speciality})</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Hospital:</span>
                <span className="font-medium text-slate-200">{confirmedBooking?.hospital}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Date &amp; Time:</span>
                <span className="font-bold text-emerald-400">{confirmedBooking?.appointment_date} at {confirmedBooking?.appointment_time}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Consultation Mode:</span>
                <span className="font-medium text-blue-300">{confirmedBooking?.consultation_type}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Patient:</span>
                <span className="font-medium text-slate-200">{confirmedBooking?.patient_name} ({confirmedBooking?.patient_phone})</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Estimated Fee:</span>
                <span className="font-black text-emerald-400 text-sm">₹{confirmedBooking?.fee}</span>
              </div>
            </div>

            {/* Twilio SMS Confirmation Dispatch Box with Patient Uploaded Details */}
            <div className="p-4 rounded-xl bg-blue-950/50 border border-blue-500/40 text-left space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <span>📲</span> Confirmation SMS Dispatched to +91 7022698509
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Twilio SMS
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800/80 text-[11px] font-mono text-slate-300 leading-relaxed whitespace-pre-line shadow-inner">
                {`🩺 MediVision AI: Appointment Confirmed!\nBooking ID: ${confirmedBooking?.booking_id}\nPatient: ${confirmedBooking?.patient_name} (Age: ${confirmedBooking?.patient_age || "N/A"}, ${confirmedBooking?.patient_gender || "N/A"})\nDoctor: ${confirmedBooking?.doctor_name} (${confirmedBooking?.speciality})\nHospital: ${confirmedBooking?.hospital}\nDate: ${confirmedBooking?.appointment_date} at ${confirmedBooking?.appointment_time}\nMode: ${confirmedBooking?.consultation_type}\nSymptoms: ${confirmedBooking?.symptoms || "General Consultation"}\nFee: ₹${confirmedBooking?.fee}\nStatus: Confirmed. Please arrive 15 min prior.`}
              </div>
              <p className="text-[10px] text-slate-400">
                ✓ An automated SMS notification containing these patient uploaded details has been queued and sent to <strong>+91 7022698509</strong>.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                Print / Save Slip
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MyAppointmentsModal({ isOpen, onClose, appointments, onCancelBooking }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0d1b30] border border-slate-700 shadow-2xl text-white">
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-slate-800 bg-[#0d1b30]/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-xl text-blue-400 shadow">
              📋
            </div>
            <div>
              <h2 className="text-base font-bold text-white">My Appointments</h2>
              <p className="text-xs text-slate-400">
                {appointments.length} active {appointments.length === 1 ? "booking" : "bookings"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-5 space-y-4">
          {appointments.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-3">
              <span className="text-4xl block">📅</span>
              <p className="text-sm font-semibold text-slate-300">No appointments scheduled yet</p>
              <p className="text-xs max-w-sm mx-auto text-slate-500">
                Browse our verified doctor profiles below to schedule your first hospital visit or video consultation.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Find Doctors Now
              </button>
            </div>
          ) : (
            appointments.map(apt => (
              <div
                key={apt.id || apt.booking_id}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{apt.doctor_name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ● Confirmed
                      </span>
                    </div>
                    <p className="text-xs text-blue-400 font-medium mt-0.5">{apt.speciality} • {apt.hospital}</p>
                    <p className="text-[11px] text-slate-400 truncate">{apt.hospital_address}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-500 font-mono block">#{apt.booking_id}</span>
                    <span className="text-xs font-black text-emerald-400">₹{apt.fee}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs">
                  <div className="flex items-center gap-4">
                    <span>📅 <strong className="text-white">{apt.appointment_date}</strong></span>
                    <span>⏰ <strong className="text-white">{apt.appointment_time}</strong></span>
                    <span className="text-blue-300">🩺 {apt.consultation_type}</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Patient: <strong className="text-slate-200">{apt.patient_name}</strong>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1 border-t border-slate-800/60">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="h-3 w-3" /> Slip
                  </button>
                  <button
                    onClick={() => onCancelBooking(apt.id || apt.booking_id)}
                    className="px-3 py-1.5 rounded-lg border border-rose-900/40 hover:bg-rose-950/50 text-rose-400 text-xs font-medium transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" /> Cancel
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


function getDistanceFromCEC(lat, lng) {
  if (!lat || !lng) return null;
  const lat1 = USER_COLLEGE_LOCATION.lat;
  const lon1 = USER_COLLEGE_LOCATION.lng;
  const lat2 = parseFloat(lat);
  const lon2 = parseFloat(lng);
  if (isNaN(lat2) || isNaN(lon2)) return null;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  return dist < 10 ? dist.toFixed(1) : Math.round(dist).toString();
}

const userCollegeMarkerIcon = L.divIcon({
  className: "custom-marker-college",
  html: `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;filter:drop-shadow(0 0 16px rgba(37,99,235,1));">
    <div style="background:linear-gradient(135deg,#2563eb,#0284c7);width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #ffffff;color:white;font-size:20px;box-shadow:0 4px 15px rgba(0,0,0,0.4);">
      🎓
    </div>
    <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid #0284c7;margin-top:-2px;"></div>
  </div>`,
  iconSize: [42, 48],
  iconAnchor: [21, 48],
  popupAnchor: [0, -48],
});

const hospitalMarkerIcon = L.divIcon({
  className: "custom-marker-clean",
  html: `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.5));">
    <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2.5px solid #ffffff;color:white;font-size:16px;">
      🏥
    </div>
    <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #7c3aed;margin-top:-2px;"></div>
  </div>`,
  iconSize: [36, 42],
  iconAnchor: [18, 42],
  popupAnchor: [0, -42],
});

const doctorMarkerIcon = L.divIcon({
  className: "custom-marker-clean",
  html: `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.5));">
    <div style="background:linear-gradient(135deg,#059669,#0d9488);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2.5px solid #ffffff;color:white;font-size:16px;">
      🩺
    </div>
    <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #0d9488;margin-top:-2px;"></div>
  </div>`,
  iconSize: [36, 42],
  iconAnchor: [18, 42],
  popupAnchor: [0, -42],
});

function MapRecenter({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.lat && coords.lng) {
      map.invalidateSize();
      map.flyTo([coords.lat, coords.lng], coords.zoom || 12, { duration: 1.2 });
    }
  }, [coords, map]);
  return null;
}

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`h-3 w-3 ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-600"}`} />
      ))}
      <span className="text-xs font-bold text-amber-400 ml-1">{rating}</span>
    </div>
  );
}

function AccreditationBadge({ label }) {
  const color = label === "JCI Accredited"
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
    : label === "Govt. Premier"
    ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
    : "bg-blue-500/10 text-blue-400 border-blue-500/30";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${color}`}>
      {label}
    </span>
  );
}

function DoctorModal({ doctor, onClose, handleOpenBooking }) {
  if (!doctor) return null;
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0d1b30] border border-slate-700 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-slate-800 bg-[#0d1b30]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow">
              {doctor.name.split(" ").slice(-1)[0][0]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{doctor.name}</h2>
              <p className="text-sm text-blue-400 font-medium">{doctor.subSpeciality}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex flex-wrap gap-2">
            {doctor.verified && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                ✓ NMC / Hospital Verified
              </span>
            )}
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
              🏥 {doctor.badge}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20">
              {doctor.experience} yrs experience
            </span>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">About</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{doctor.about}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Qualifications</h3>
              <p className="text-sm text-slate-200 font-medium">{doctor.qualifications}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Registration</h3>
              <p className="text-sm text-slate-200 font-medium">{doctor.council}</p>
              <p className="text-xs text-blue-400 font-mono">{doctor.registrationNumber}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Hospital</h3>
              <p className="text-sm text-slate-200 font-semibold">{doctor.hospital}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{doctor.address}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <StarRating rating={doctor.rating} />
              <p className="text-xs text-slate-400 mt-1">{doctor.reviewCount} patient reviews</p>
            </div>
          </div>
          {/* Direct Appointment Booking CTA */}
          <button
            type="button"
            onClick={() => {
              onClose();
              handleOpenBooking(doctor);
            }}
            className="w-full inline-flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-blue-600/25 transition-all duration-200 cursor-pointer"
          >
            <span className="text-lg">📅</span>
            Book In-Clinic / Video Appointment
          </button>
          <div className="pt-1">
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${doctor.lat},${doctor.lng}`} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 text-sm font-medium transition-colors">
              <Compass className="h-4 w-4" />Directions
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

const DoctorSearchPage = () => {
  const [heroQuery, setHeroQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [filterSpeciality, setFilterSpeciality] = useState("All Specialities");
  const [filterCity, setFilterCity] = useState("All Cities");
  const [filterExp, setFilterExp] = useState("Any Experience");

  const [displayedDoctors, setDisplayedDoctors] = useState(REAL_DOCTORS);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // In-app Appointment Booking States
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isMyAppointmentsOpen, setIsMyAppointmentsOpen] = useState(false);
  const [userAppointments, setUserAppointments] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("medivision_appointments") || "[]");
    } catch {
      return [];
    }
  });

  const handleOpenBooking = (doc) => {
    setBookingDoctor(doc);
    setIsBookingModalOpen(true);
  };

  const handleBookingSuccess = (newBooking) => {
    setUserAppointments(prev => [newBooking, ...prev]);
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    const updated = userAppointments.filter(a => (a.id !== bookingId && a.booking_id !== bookingId));
    setUserAppointments(updated);
    try {
      localStorage.setItem("medivision_appointments", JSON.stringify(updated));
      await fetch(`/api/appointments/${bookingId}`, { method: "DELETE" });
    } catch (e) {
      console.warn("Error deleting appointment:", e);
    }
  };
  const [activeMapCity, setActiveMapCity] = useState("All Cities");
  const [mapCoords, setMapCoords] = useState(
    (KARNATAKA_CITY_COORDINATES && KARNATAKA_CITY_COORDINATES["All Cities"]) || { lat: 14.1, lng: 75.8, zoom: 7 }
  );
  const [mapItems, setMapItems] = useState(TOP_HOSPITALS);
  const mapSectionRef = useRef(null);
  const markerRefs = useRef({});
  const doctorsRef = useRef(null);

  const handleSelectMapCity = (cityName) => {
    setActiveMapCity(cityName);
    setSelectedCity(cityName);
    setFilterCity(cityName);
    const config = (KARNATAKA_CITY_COORDINATES && KARNATAKA_CITY_COORDINATES[cityName]) || { lat: 14.1, lng: 75.8, zoom: 7 };
    setMapCoords(config);
    if (cityName === "All Cities") {
      setMapItems(TOP_HOSPITALS);
      setDisplayedDoctors(REAL_DOCTORS);
    } else if (cityName.toLowerCase().includes("bantwal")) {
      const cityHospitals = TOP_HOSPITALS.filter(h => h.city === "Bantwal" || h.city === "Mangalore");
      const cityDocs = REAL_DOCTORS.filter(d => d.city === "Bantwal" || d.city === "Mangalore");
      setMapItems(cityHospitals);
      setDisplayedDoctors(cityDocs);
    } else {
      const cityHospitals = TOP_HOSPITALS.filter(h => h.city.toLowerCase() === cityName.toLowerCase());
      const cityDocs = REAL_DOCTORS.filter(d => d.city.toLowerCase() === cityName.toLowerCase());
      setMapItems(cityHospitals.length > 0 ? cityHospitals : cityDocs);
      setDisplayedDoctors(cityDocs);
    }
  };

  const handleLocateCEC = () => {
    handleSelectMapCity("Bantwal (CEC 574219)");
    mapSectionRef.current && mapSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const applyFilters = (spec, city, exp) => {
    let list = REAL_DOCTORS;
    if (spec && spec !== "All Specialities") list = list.filter(d => d.speciality === spec);
    if (city && city !== "All Cities") {
      if (city.toLowerCase().includes("bantwal")) {
        list = list.filter(d => d.city === "Bantwal" || d.city === "Mangalore");
      } else {
        list = list.filter(d => d.city === city);
      }
    }
    if (exp === "0-10 yrs") list = list.filter(d => d.experience <= 10);
    else if (exp === "10-20 yrs") list = list.filter(d => d.experience > 10 && d.experience <= 20);
    else if (exp === "20+ yrs") list = list.filter(d => d.experience > 20);
    setDisplayedDoctors(list);
  };

  const handleApplyFilters = () => {
    applyFilters(filterSpeciality, filterCity, filterExp);
    doctorsRef.current && doctorsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleResetFilters = () => {
    setFilterSpeciality("All Specialities");
    setFilterCity("All Cities");
    setFilterExp("Any Experience");
    setDisplayedDoctors(REAL_DOCTORS);
  };

  const handleHeroSearch = () => {
    let list = REAL_DOCTORS;
    if (heroQuery.trim()) {
      const q = heroQuery.toLowerCase();
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.speciality.toLowerCase().includes(q) ||
        d.subSpeciality.toLowerCase().includes(q) ||
        d.hospital.toLowerCase().includes(q)
      );
    }
    if (selectedCity !== "All Cities") {
      if (selectedCity.toLowerCase().includes("bantwal")) {
        list = list.filter(d => d.city === "Bantwal" || d.city === "Mangalore");
        const cfg = KARNATAKA_CITY_COORDINATES["Bantwal (CEC 574219)"];
        if (cfg) setMapCoords(cfg);
        const cityHospitals = TOP_HOSPITALS.filter(h => h.city === "Bantwal" || h.city === "Mangalore");
        setMapItems(cityHospitals);
        setActiveMapCity(selectedCity);
      } else {
        list = list.filter(d => d.city === selectedCity);
        const cfg = KARNATAKA_CITY_COORDINATES && KARNATAKA_CITY_COORDINATES[selectedCity];
        if (cfg) setMapCoords(cfg);
        const cityHospitals = TOP_HOSPITALS.filter(h => h.city === selectedCity);
        setMapItems(cityHospitals.length > 0 ? cityHospitals : list);
        setActiveMapCity(selectedCity);
      }
    } else {
      const cfg = KARNATAKA_CITY_COORDINATES && KARNATAKA_CITY_COORDINATES["All Cities"];
      if (cfg) setMapCoords(cfg);
      setMapItems(TOP_HOSPITALS);
      setActiveMapCity("All Cities");
    }
    setDisplayedDoctors(list);
    setFilterCity(selectedCity);
    doctorsRef.current && doctorsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSpecialityClick = (specId) => {
    setFilterSpeciality(specId);
    applyFilters(specId, filterCity, filterExp, filterFee);
    doctorsRef.current && doctorsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleViewProfile = (doc) => {
    setSelectedDoctor(doc);
    setRecentlyViewed(prev => {
      if (prev.find(d => d.id === doc.id)) return prev;
      return [doc, ...prev].slice(0, 5);
    });
  };

  const handleLocateOnMap = (doc) => {
    setMapCoords({ lat: doc.lat, lng: doc.lng, zoom: 15 });
    setMapItems([doc]);
    setActiveMapCity(doc.city);
    mapSectionRef.current && mapSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="min-h-screen bg-[#060e1b] text-white">

      {/* ===== HERO SECTION ===== */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#0a1628 0%,#0d1f3c 50%,#0f2447 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "linear-gradient(#334155 1px,transparent 1px),linear-gradient(90deg,#334155 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
              <Home className="h-3.5 w-3.5" />
              Home
              <ChevronRight className="h-3 w-3" />
              <span className="text-blue-400">Find Doctors</span>
            </Link>
          </div>

          <div className="flex flex-wrap gap-3 mb-5">
            {["Verified Doctor Profiles", "Human-Moderated Patient Reviews", "Zero Pay-to-Play"].map(b => (
              <span key={b} className="px-3 py-1 rounded-full bg-blue-600/15 border border-blue-500/25 text-blue-300 text-xs font-semibold">
                ✓ {b}
              </span>
            ))}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-3 max-w-3xl">
            Doctor Reviews,{" "}
            <span className="text-blue-400">Doctor Profiles,</span>
            <br />
            Patient Reviews.{" "}
            <span className="text-blue-400">Honest. Free. Unbiased.</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mb-8 leading-relaxed">
            Read patient reviews for doctors across top hospitals — Bangalore, Mysore, Mangalore and more.
            A profile is marked ✓ KMC Verified only after we cross-check the doctor's
            registration against the Medical Council registry. Reviews are human-moderated.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Doctor name or speciality (e.g. Cardiologist)"
                value={heroQuery}
                onChange={e => setHeroQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleHeroSearch()}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-all text-sm backdrop-blur-sm"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-400" />
              <select
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                className="pl-9 pr-8 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-500 transition-all text-sm backdrop-blur-sm appearance-none cursor-pointer min-w-[160px]"
              >
                {KARNATAKA_CITIES.map(c => (
                  <option key={c} value={c} className="bg-[#0d1b30]">{c}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleHeroSearch}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <Search className="h-4 w-4" />
              Search →
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Detected Location:</span>
            <button
              type="button"
              onClick={handleLocateCEC}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600/30 text-blue-300 hover:text-white text-xs font-semibold transition-all shadow-sm"
            >
              🎓 Canara Engineering College, Bantwal (574219)
              <span className="px-1.5 py-0.5 rounded bg-blue-500 text-white font-bold text-[10px]">Center Map 📍</span>
            </button>
            <button
              type="button"
              onClick={() => setIsMyAppointmentsOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-emerald-300 hover:text-white text-xs font-semibold transition-all shadow-sm cursor-pointer ml-auto"
            >
              <span>📋 My Appointments</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px]">
                {userAppointments.length}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ===== MAP SECTION ===== */}
      <section ref={mapSectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Current Location Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-950/70 via-slate-900/80 to-indigo-950/70 border border-blue-500/30 mb-5 shadow-xl">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-2xl shrink-0 shadow-inner">
              🎓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-blue-400 uppercase tracking-wider">Your Current Location</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  ● GPS: Bantwal 574219
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-0.5">Canara Engineering College, Benjanapadavu</h3>
              <p className="text-xs text-slate-400">Bantwal Taluk, Dakshina Kannada – 574219</p>
            </div>
          </div>
          <button
            onClick={handleLocateCEC}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all self-start sm:self-auto"
          >
            <Compass className="h-4 w-4" />
            Locate Hospitals Near College
          </button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-blue-400" />
              <span className="text-base font-bold text-white">Healthcare &amp; Hospital Locator</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Live OpenStreetMap
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified original hospital &amp; clinic addresses with one-click directions.
            </p>
          </div>
          <button
            onClick={() => handleSelectMapCity("All Cities")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 hover:border-blue-500 bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all self-start sm:self-auto"
          >
            <RotateCcw className="h-3.5 w-3.5 text-blue-400" />
            Fit State View
          </button>
        </div>

        {/* Quick City Switcher Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3 scrollbar-thin">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">City:</span>
          {KARNATAKA_CITIES.map(c => {
            const isActive = activeMapCity.toLowerCase() === c.toLowerCase();
            return (
              <button
                key={c}
                onClick={() => handleSelectMapCity(c)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30"
                    : "bg-[#0d1b30] text-slate-300 border-slate-700/80 hover:border-slate-500 hover:text-white"
                }`}
              >
                {c === "All Cities" ? "🌐 All Cities" : `📍 ${c}`}
              </button>
            );
          })}
        </div>

        {/* Map Container */}
        <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
          <MapContainer center={[mapCoords.lat, mapCoords.lng]} zoom={mapCoords.zoom || 7} className="h-[400px] w-full z-0">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <MapRecenter coords={mapCoords} />
            {/* User College Marker */}
            <Marker position={[USER_COLLEGE_LOCATION.lat, USER_COLLEGE_LOCATION.lng]} icon={userCollegeMarkerIcon}>
              <Popup>
                <div className="p-1 max-w-[270px] font-sans space-y-2 text-slate-800">
                  <div className="flex items-start gap-2 border-b border-slate-200 pb-2">
                    <span className="text-2xl shrink-0">🎓</span>
                    <div>
                      <h3 className="font-bold text-xs text-slate-900 leading-tight">Canara Engineering College</h3>
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 mt-0.5">
                        📍 Your Current Location
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-2 rounded text-[11px] text-slate-700 leading-snug">
                    Benjanapadavu, Bantwal Taluk, Dakshina Kannada – <strong>574219</strong>
                  </div>
                  <div className="text-[10px] text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-800">Nearest Healthcare Centers:</p>
                    <p>• Father Muller Hospital Thumbay (~4.8 km)</p>
                    <p>• Bantwal Taluk Hospital (~7.8 km)</p>
                    <p>• KMC Hospital Mangalore (~17 km)</p>
                  </div>
                </div>
              </Popup>
            </Marker>
            {mapItems.map((item, idx) => {
              const lat = parseFloat(item.lat), lng = parseFloat(item.lng);
              if (isNaN(lat) || isNaN(lng)) return null;
              const isHospital = !item.speciality;
              const icon = isHospital ? hospitalMarkerIcon : doctorMarkerIcon;
              return (
                <Marker key={item.id || idx} position={[lat, lng]} icon={icon} ref={el => (markerRefs.current[idx] = el)}>
                  <Popup>
                    <div className="p-1 max-w-[270px] font-sans space-y-2 text-slate-800">
                      <div className="flex items-start gap-2 border-b border-slate-200 pb-2">
                        <span className="text-xl shrink-0 mt-0.5">{isHospital ? "🏥" : "🩺"}</span>
                        <div className="min-w-0">
                          <h3 className="font-bold text-xs text-slate-900 leading-snug">{item.name || item.hospital}</h3>
                          {item.speciality && (
                            <p className="text-[11px] text-blue-600 font-semibold mt-0.5">{item.speciality} • {item.hospital}</p>
                          )}
                          {item.subtitle && <p className="text-[10px] text-slate-500 truncate mt-0.5">{item.subtitle}</p>}
                        </div>
                      </div>

                      {/* Complete Physical Address */}
                      <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-[11px] text-slate-700 leading-relaxed">
                        📍 <span className="font-medium">{item.address || item.location}</span>
                      </div>
                      {getDistanceFromCEC(item.lat, item.lng) && (
                        <div className="text-[10px] font-semibold text-blue-800 bg-blue-50 border border-blue-100 px-2 py-1 rounded flex items-center gap-1">
                          🧭 {getDistanceFromCEC(item.lat, item.lng)} km from Canara Engineering College
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span>⭐ {item.rating || "4.8"} ({item.reviewCount || "100+"} reviews)</span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">{item.city}</span>
                      </div>

                      {item.phone && (
                        <a href={`tel:${item.phone}`} className="flex items-center gap-1.5 text-[11px] text-slate-700 hover:text-blue-600 font-medium">
                          📞 {item.phone}
                        </a>
                      )}

                      <div className="flex gap-2 pt-1">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-1.5 text-center text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                        >
                          🗺️ Directions
                        </a>
                        {item.website ? (
                          <a
                            href={item.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-center text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            Website ↗
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenBooking(item)}
                            className="px-3 py-1.5 text-center text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors cursor-pointer"
                          >
                            📅 Book
                          </button>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </section>

      {/* ===== BROWSE BY SPECIALITY ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Browse by Speciality</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            Find Doctors by <span className="text-blue-400">Medical Speciality</span>
          </h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Compare doctor profiles for top specialists across Karnataka — Bangalore, Mysore, Mangalore & more.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {SPECIALITIES.map(spec => (
            <button
              key={spec.id}
              onClick={() => handleSpecialityClick(spec.id)}
              className={`group flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 hover:border-blue-500/50 hover:bg-blue-600/10 text-center ${
                filterSpeciality === spec.id ? "border-blue-500 bg-blue-600/15" : "border-slate-800 bg-[#0d1b30]"
              }`}
            >
              <span className="text-3xl">{spec.icon}</span>
              <span className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors leading-tight">
                {spec.name}
              </span>
              <span className="text-xs text-blue-400 font-medium">View specialists →</span>
            </button>
          ))}
        </div>
      </section>

      {/* ===== DIRECT IN-APP APPOINTMENT BOOKING SYSTEM BANNER ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative overflow-hidden rounded-2xl border border-blue-700/40 bg-gradient-to-r from-blue-950/70 via-indigo-950/60 to-blue-950/70 p-6 sm:p-8 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                <span className="text-2xl">📅</span>
                <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Direct In-App Booking System</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-1">
                Book a Verified Specialist <span className="text-blue-400">Instantly</span>
              </h2>
              <p className="text-slate-400 text-sm max-w-lg">
                Schedule in-person hospital consultations or telehealth video calls with KMC-registered doctors across Bantwal, Mangalore, and Karnataka. Instant confirmation slip and zero booking fees.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleOpenBooking(displayedDoctors[0] || REAL_DOCTORS[0])}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all whitespace-nowrap cursor-pointer"
              >
                <Calendar className="h-4 w-4" />
                Book An Appointment
              </button>
              <button
                type="button"
                onClick={() => setIsMyAppointmentsOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-900/80 text-slate-200 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer"
              >
                📋 View My Bookings ({userAppointments.length})
              </button>
            </div>
          </div>
          {/* Quick Speciality Booking Chips */}
          <div className="mt-5 pt-5 border-t border-slate-800/80">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Quick book by speciality:</p>
            <div className="flex flex-wrap gap-2">
              {SPECIALITIES.slice(0, 8).map(spec => (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => handleSpecialityClick(spec.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700 hover:border-blue-500 hover:bg-blue-900/30 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  <span>{spec.icon}</span>
                  {spec.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== DOCTOR PROFILES SECTION ===== */}
      <section ref={doctorsRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Doctor Profiles</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            Find a Doctor <span className="text-blue-400">Near You</span>
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto">
            Profiles across specialities and cities. ✓ KMC Verified badge means we cross-checked the doctor against the Medical Council register.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-2xl bg-[#0d1b30] border border-slate-800 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Speciality</label>
              <select
                value={filterSpeciality}
                onChange={e => setFilterSpeciality(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option>All Specialities</option>
                {SPECIALITIES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">City</label>
              <select
                value={filterCity}
                onChange={e => setFilterCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              >
                {KARNATAKA_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Experience</label>
              <select
                value={filterExp}
                onChange={e => setFilterExp(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              >
                {["Any Experience", "0-10 yrs", "10-20 yrs", "20+ yrs"].map(e => <option key={e}>{e}</option>)}
              </select>
            </div>

          </div>
          <div className="flex gap-3">
            <button
              onClick={handleApplyFilters}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />Apply Filters
            </button>
            <button
              onClick={handleResetFilters}
              className="px-5 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-medium transition-colors flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />Reset
            </button>
          </div>
        </div>

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-[#0d1b30] border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Recently Viewed</span>
              </div>
              <button onClick={() => setRecentlyViewed([])} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentlyViewed.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => handleViewProfile(doc)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 hover:border-blue-500/50 text-xs font-medium text-slate-300 hover:text-white transition-all"
                >
                  <span className="text-blue-400 font-semibold">{doc.name}</span>
                  <span className="text-slate-500">{doc.subSpeciality}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-400">
            Showing <span className="text-white font-semibold">{displayedDoctors.length}</span> verified doctors
          </p>
        </div>

        {/* Doctor Cards */}
        {displayedDoctors.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-slate-800 bg-[#0d1b30]">
            <p className="text-slate-400 text-lg font-semibold">No doctors match the selected filters.</p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedDoctors.map(doc => (
              <div
                key={doc.id}
                className="group relative rounded-2xl bg-[#0d1b30] border border-slate-800 hover:border-blue-500/40 p-5 shadow-lg transition-all duration-300 hover:shadow-blue-500/10 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-lg font-bold text-white shadow-md shrink-0">
                      {doc.name.split(" ").slice(-1)[0][0]}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors truncate">
                        {doc.name}
                      </h3>
                      <p className="text-xs text-blue-400 font-semibold">{doc.speciality}</p>
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-400">
                        <MapPin className="h-3 w-3 text-rose-400 shrink-0" />
                        <span className="truncate">{doc.hospital}, {doc.city}</span>
                      </div>
                      {getDistanceFromCEC(doc.lat, doc.lng) && (
                        <div className="flex items-center gap-1 mt-1 text-[11px] text-blue-400 font-semibold">
                          <Compass className="h-3 w-3 text-blue-400 shrink-0" />
                          <span>{getDistanceFromCEC(doc.lat, doc.lng)} km from CEC Bantwal</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800/60">
                    <p className="text-[11px] text-slate-400 leading-relaxed">{doc.qualifications}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                      {doc.experience} yrs exp
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-semibold border border-slate-700">
                      🏥 {doc.badge}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-medium border border-slate-700">
                      {doc.council.split("/")[0].trim().split(" ").slice(0, 3).join(" ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <StarRating rating={doc.rating} />
                  </div>
                </div>
                <div className="pt-4 mt-3 border-t border-slate-800/60 space-y-2">
                  {/* In-App Direct Appointment Booking Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenBooking(doc)}
                    className="w-full h-9 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    <Calendar className="h-3.5 w-3.5" /> Book Appointment
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewProfile(doc)}
                      className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20"
                    >
                      <Eye className="h-3.5 w-3.5" />View profile
                    </button>
                    <button
                      onClick={() => handleLocateOnMap(doc)}
                      className="h-9 px-3 inline-flex items-center justify-center gap-1 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
                      title="Locate on Map"
                    >
                      <Compass className="h-3.5 w-3.5 text-blue-400" />
                    </button>
                    <a
                      href={`tel:${doc.phone}`}
                      className="h-9 px-3 inline-flex items-center justify-center gap-1 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
                      title="Call"
                    >
                      <Phone className="h-3.5 w-3.5 text-emerald-400" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== 4-STEP PROCESS ===== */}
      <section className="bg-[#0d1b30]/60 border-y border-slate-800 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Simple Process</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              Find the Right Doctor in <span className="text-blue-400">4 Easy Steps</span>
            </h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              From searching to booking, find your ideal doctor in minutes, completely free.
            </p>
          </div>
          <div className="relative grid grid-cols-1 sm:grid-cols-4 gap-8">
            <div className="hidden sm:block absolute top-7 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 opacity-30" />
            {[
              { step: 1, icon: "🔍", title: "Search", desc: "Enter your speciality need and city. Filter by rating, experience, and hospital." },
              { step: 2, icon: "📋", title: "Read Reviews", desc: "Compare patient reviews, star ratings, wait times, and doctor behaviour ratings." },
              { step: 3, icon: "📅", title: "Book Appointment", desc: "Book online, via phone, or walk in. In-person or video consultation both available." },
              { step: 4, icon: "⭐", title: "Leave a Review", desc: "After your visit, leave a moderator-reviewed review to help future patients decide." },
            ].map(item => (
              <div key={item.step} className="flex flex-col items-center text-center gap-3 relative z-10">
                <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/30 border-4 border-[#0d1b30]">
                  {item.step}
                </div>
                <span className="text-3xl">{item.icon}</span>
                <h3 className="text-base font-bold text-white">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-[180px]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TOP HOSPITALS ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Top Hospitals</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            Top Hospitals — <span className="text-blue-400">Verified &amp; Rated</span>
          </h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            NABH &amp; JCI accredited hospitals across Bangalore, Mangalore, and Mysore with patient reviews.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOP_HOSPITALS.map(hosp => (
            <div
              key={hosp.id}
              className="group rounded-2xl bg-[#0d1b30] border border-slate-800 hover:border-blue-500/40 p-5 shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-lg shadow-md shrink-0">
                    🏛️
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">{hosp.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-400">
                      <MapPin className="h-3 w-3 text-rose-400 shrink-0" />
                      <span className="truncate">{hosp.location}</span>
                    </div>
                    {getDistanceFromCEC(hosp.lat, hosp.lng) && (
                      <div className="flex items-center gap-1 mt-1 text-[11px] text-blue-400 font-semibold">
                        <Compass className="h-3 w-3 text-blue-400 shrink-0" />
                        <span>{getDistanceFromCEC(hosp.lat, hosp.lng)} km from CEC Bantwal</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {hosp.accreditations.map(acc => <AccreditationBadge key={acc} label={acc} />)}
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wide">
                    {hosp.beds.toLocaleString()} beds
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{hosp.specialitiesList}</p>
                <div className="flex items-center gap-2">
                  <StarRating rating={hosp.rating} />
                  <span className="text-xs text-slate-500">({hosp.reviewCount} reviews)</span>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center gap-2">
                <button
                  onClick={() => {
                    setMapCoords({ lat: hosp.lat, lng: hosp.lng, zoom: 15 });
                    setMapItems([hosp]);
                    setActiveMapCity(hosp.city);
                    mapSectionRef.current && mapSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
                >
                  View on Map →
                </button>
                {hosp.website && (
                  <a
                    href={hosp.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 px-3 inline-flex items-center justify-center rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <a
                  href={`tel:${hosp.phone}`}
                  className="h-9 px-3 inline-flex items-center justify-center rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-emerald-400" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FOOTER CTA ===== */}
      <section className="bg-gradient-to-r from-blue-900/30 via-indigo-900/30 to-purple-900/30 border-t border-slate-800 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Award className="h-10 w-10 text-blue-400 mx-auto mb-3" />
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-3">Trusted by patients everywhere</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
            All doctor profiles are sourced from verified public hospital directories,
            Medical Council registries, and NABH accreditation records. No pay-to-rank bias.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-center">
            {[
              { num: "80+", label: "KMC-Verified Specialists" },
              { num: "8", label: "Verified Hospitals" },
              { num: "3", label: "Cities Covered" },
              { num: "100%", label: "Unbiased & Free" },
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-2xl font-black text-blue-400">{stat.num}</p>
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {selectedDoctor && (
        <DoctorModal
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          handleOpenBooking={handleOpenBooking}
        />
      )}

      {/* In-App Appointment Booking Modal */}
      <AppointmentBookingModal
        doctor={bookingDoctor}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* Patient's Booked Appointments Modal */}
      <MyAppointmentsModal
        isOpen={isMyAppointmentsOpen}
        onClose={() => setIsMyAppointmentsOpen(false)}
        appointments={userAppointments}
        onCancelBooking={handleCancelBooking}
      />
    </div>
  );
};

export default DoctorSearchPage;

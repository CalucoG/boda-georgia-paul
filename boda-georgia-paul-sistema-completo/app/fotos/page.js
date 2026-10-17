"use client";
import { useEffect, useMemo, useState } from "react";
import Nav from "../../components/Nav";
import { WEDDING_CONFIG } from "../../lib/config";

function isUnlocked() { return Date.now() >= new Date(WEDDING_CONFIG.photoUnlockISO).getTime(); }
export default function FotosPage() {
  const [unlocked, setUnlocked] = useState(isUnlocked());
  const [file, setFile] = useState(null), [guest, setGuest] = useState(""), [consent, setConsent] = useState(false), [status, setStatus] = useState(""), [loading, setLoading] = useState(false);
  const preview = useMemo(() => file ? URL.createObjectURL(file) : "", [file]);
  useEffect(() => { if (unlocked) return; const t=setInterval(()=>setUnlocked(isUnlocked()),1000); return ()=>clearInterval(t); }, [unlocked]);

  async function handleUpload(e) {
    e.preventDefault(); setStatus("");
    if (!unlocked) return setStatus("La sección de fotos todavía no está habilitada.");
    if (!file) return setStatus("Selecciona o toma una foto primero.");
    if (!consent) return setStatus("Debes autorizar el envío de la foto.");
    const form=new FormData(); form.append("file",file); form.append("guest",guest.trim());
    try { setLoading(true); setStatus("Subiendo tu foto..."); const response=await fetch("/api/upload",{method:"POST",body:form}); const data=await response.json(); if(!response.ok) throw new Error(data.error||"No se pudo subir la foto."); setStatus("¡Foto enviada! Ya puedes verla en la galería."); setFile(null); setGuest(""); setConsent(false); }
    catch(error){ setStatus(error.message||"Ocurrió un error."); } finally { setLoading(false); }
  }

  return <main className="innerPage"><Nav /><section className="contentWrap"><div className="pageIntro"><p className="sectionLabel">Recuerdos del día</p><h1>Comparte tu foto</h1><p>{unlocked ? "Toma una foto en este instante o selecciónala desde tu galería." : "Esta sección se habilitará automáticamente cuando termine la cuenta regresiva."}</p></div>
    {!unlocked ? <div className="lockedPhotoCard"><div className="cameraIcon">◎</div><h2>Muy pronto</h2><p>Queremos que la historia empiece en el momento indicado. El botón se activará automáticamente a las 8:30 PM.</p><button className="mainButton" disabled>Tomar / subir foto</button></div>
    : <div className="card"><form onSubmit={handleUpload}><label className="cameraBox">{preview ? <img src={preview} alt="Vista previa" /> : <div className="cameraEmpty"><span className="cameraIcon">◎</span><strong>Toca para abrir la cámara</strong><small>JPG, PNG o WEBP · máximo 8 MB</small></div>}<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={e=>setFile(e.target.files?.[0]||null)} /></label><label className="field"><span>Tu nombre <em>(opcional)</em></span><input value={guest} onChange={e=>setGuest(e.target.value)} placeholder="Ej. Carlos" /></label><label className="consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} /><span>Autorizo guardar esta foto como recuerdo de la boda.</span></label><button className="mainButton" type="submit" disabled={loading}>{loading?"Subiendo...":"Subir foto"}</button>{status&&<p className="status">{status}</p>}</form></div>}
  </section></main>;
}

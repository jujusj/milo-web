function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

module.exports = function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Méthode non autorisée." });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

  if (body.website) {
    return res.status(200).json({ ok: true });
  }

  const errors = {};
  if (!isEmail(body.email)) {
    errors.email = "Adresse e-mail invalide.";
  }
  if (body.consent !== "on" && body.consent !== true) {
    errors.consent = "Consentement requis.";
  }
  if (body.profile && !["parent", "enseignant", "orthophoniste", "autre"].includes(body.profile)) {
    errors.profile = "Profil invalide.";
  }

  if (Object.keys(errors).length) {
    return res.status(422).json({ ok: false, errors });
  }

  return res.status(200).json({
    ok: true,
    message: "Demande reçue. Connecter ici l'outil d'emailing ou la base de données retenue avant lancement."
  });
};

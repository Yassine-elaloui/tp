import React, { useEffect, useMemo, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import "./App.css";

const STATUTS = [
  { value: "À faire", color: "#f59e0b" },
  { value: "En cours", color: "#3987f6" },
  { value: "Terminée", color: "#16b887" },
];

function getDuree(debut, fin) {
  if (!debut || !fin) return 0;

  const dateDebut = new Date(`${debut}T00:00:00`);
  const dateFin = new Date(`${fin}T00:00:00`);
  return Math.max(1, Math.round((dateFin - dateDebut) / 86400000) + 1);
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR");
}

function App() {
  const [taches, setTaches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("taskflow-taches")) || [];
    } catch {
      return [];
    }
  });

  const [nom, setNom] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [statut, setStatut] = useState("À faire");
  const [idModification, setIdModification] = useState(null);
  const [filtre, setFiltre] = useState("Toutes");

  useEffect(() => {
    localStorage.setItem("taskflow-taches", JSON.stringify(taches));
  }, [taches]);

  const statistiques = useMemo(() => ({
    total: taches.length,
    aFaire: taches.filter((t) => t.statut === "À faire").length,
    enCours: taches.filter((t) => t.statut === "En cours").length,
    terminees: taches.filter((t) => t.statut === "Terminée").length,
    duree: taches.reduce((sum, t) => sum + getDuree(t.dateDebut, t.dateFin), 0),
  }), [taches]);

  const donneesGraphique = STATUTS.map((item) => ({
    name: item.value,
    value: taches.filter((t) => t.statut === item.value).length,
    color: item.color,
  })).filter((item) => item.value > 0);

  const tachesAffichees = [...taches]
    .filter((t) => filtre === "Toutes" || t.statut === filtre)
    .sort((a, b) => a.dateDebut.localeCompare(b.dateDebut));

  function reinitialiserFormulaire() {
    setNom("");
    setDateDebut("");
    setDateFin("");
    setStatut("À faire");
    setIdModification(null);
  }

  function enregistrerTache(e) {
    e.preventDefault();

    if (!nom.trim() || !dateDebut || !dateFin) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    if (dateDebut > dateFin) {
      alert("La date de début doit être antérieure ou égale à la date de fin.");
      return;
    }

    const tache = {
      id: idModification ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      nom: nom.trim(),
      dateDebut,
      dateFin,
      statut,
    };

    if (idModification !== null) {
      setTaches((ancienneListe) =>
        ancienneListe.map((item) => item.id === idModification ? tache : item)
      );
    } else {
      setTaches((ancienneListe) => [...ancienneListe, tache]);
    }

    reinitialiserFormulaire();
  }

  function preparerModification(tache) {
    setNom(tache.nom);
    setDateDebut(tache.dateDebut);
    setDateFin(tache.dateFin);
    setStatut(tache.statut);
    setIdModification(tache.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function supprimerTache(id) {
    const confirmation = window.confirm("Voulez-vous vraiment supprimer cette tâche ?");
    if (!confirmation) return;

    setTaches((ancienneListe) => ancienneListe.filter((t) => t.id !== id));
    if (idModification === id) reinitialiserFormulaire();
  }

  function changerStatut(id, nouveauStatut) {
    setTaches((ancienneListe) =>
      ancienneListe.map((t) => t.id === id ? { ...t, statut: nouveauStatut } : t)
    );
  }

  return (
    <main className="app-shell">
      
      <section className="page-heading">
        <div>
          <p className="eyebrow">ORGANISATION & PRODUCTIVITÉ</p>
          <h1>Gestion des tâches</h1>
          <p className="page-subtitle">Planifiez votre travail et suivez votre progression.</p>
        </div>
        <div className="date-chip">
          <span className="date-dot" />
          Tableau de bord
        </div>
      </section>

      <section className="stats-grid" aria-label="Statistiques du projet">
        <article className="stat-card stat-total">
          <div className="stat-icon">▦</div>
          <p>Total des tâches</p>
          <strong>{statistiques.total}</strong>
          <span className="stat-note">Tâches enregistrées</span>
        </article>
        <article className="stat-card stat-todo">
          <div className="stat-icon">◷</div>
          <p>À faire</p>
          <strong>{statistiques.aFaire}</strong>
          <span className="stat-note">En attente</span>
        </article>
        <article className="stat-card stat-progress">
          <div className="stat-icon">↗</div>
          <p>En cours</p>
          <strong>{statistiques.enCours}</strong>
          <span className="stat-note">Travail en cours</span>
        </article>
        <article className="stat-card stat-done">
          <div className="stat-icon">✓</div>
          <p>Terminées</p>
          <strong>{statistiques.terminees}</strong>
          <span className="stat-note">Objectifs atteints</span>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel form-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">GESTION</p>
              <h2>{idModification !== null ? "Modifier la tâche" : "Nouvelle tâche"}</h2>
            </div>
            <span className="heading-icon">＋</span>
          </div>

          <form onSubmit={enregistrerTache} className="task-form">
            <label htmlFor="nom">Nom de la tâche</label>
            <input
              id="nom"
              type="text"
              placeholder="Ex. : Créer une page web"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              maxLength={90}
            />

            <div className="form-row">
              <div>
                <label htmlFor="dateDebut">Date de début</label>
                <input
                  id="dateDebut"
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="dateFin">Date de fin</label>
                <input
                  id="dateFin"
                  type="date"
                  min={dateDebut || undefined}
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                />
              </div>
            </div>

            <label htmlFor="statut">Statut</label>
            <select id="statut" value={statut} onChange={(e) => setStatut(e.target.value)}>
              {STATUTS.map((item) => (
                <option key={item.value} value={item.value}>{item.value}</option>
              ))}
            </select>

            <div className="form-actions">
              <button className="btn-primary" type="submit">
                {idModification !== null ? "Enregistrer les changements" : "Ajouter la tâche"}
              </button>
              {idModification !== null && (
                <button className="btn-light" type="button" onClick={reinitialiserFormulaire}>
                  Annuler
                </button>
              )}
            </div>
          </form>
        </article>

        <article className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">VUE D'ENSEMBLE</p>
              <h2>État d'avancement</h2>
            </div>
            <span className="heading-icon chart-icon">◔</span>
          </div>

          {taches.length === 0 ? (
            <div className="empty-chart">
              <span className="empty-chart-icon">◌</span>
              <strong>Aucune donnée disponible</strong>
              <p>Ajoutez des tâches pour afficher leur répartition.</p>
            </div>
          ) : (
            <>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donneesGraphique}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {donneesGraphique.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} tâche(s)`, "Nombre"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-center">
                  <strong>{statistiques.total}</strong>
                  <span>Tâches</span>
                </div>
              </div>
              <div className="chart-legend">
                {STATUTS.map((item) => (
                  <div className="legend-item" key={item.value}>
                    <span className="legend-dot" style={{ background: item.color }} />
                    <span>{item.value}</span>
                    <strong>{taches.filter((t) => t.statut === item.value).length}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </article>
      </section>

      <section className="panel list-panel">
        <div className="list-heading">
          <div>
            <p className="eyebrow">SUIVI DU TRAVAIL</p>
            <h2>Liste des tâches</h2>
            <p className="list-subtitle">
              Durée cumulée : <strong>{statistiques.duree} jour(s)</strong>
            </p>
          </div>
          <div className="filter-control">
            <label htmlFor="filtre">Filtrer :</label>
            <select id="filtre" value={filtre} onChange={(e) => setFiltre(e.target.value)}>
              <option value="Toutes">Toutes</option>
              {STATUTS.map((item) => (
                <option key={item.value} value={item.value}>{item.value}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Tâche</th>
                <th>Date de début</th>
                <th>Date de fin</th>
                <th>Durée</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tachesAffichees.map((tache) => (
                <tr key={tache.id}>
                  <td className="task-name">{tache.nom}</td>
                  <td>{formatDate(tache.dateDebut)}</td>
                  <td>{formatDate(tache.dateFin)}</td>
                  <td>{getDuree(tache.dateDebut, tache.dateFin)} jour(s)</td>
                  <td>
                    <select
                      className={`status-select ${tache.statut === "Terminée" ? "status-done" : tache.statut === "En cours" ? "status-progress" : "status-todo"}`}
                      value={tache.statut}
                      onChange={(e) => changerStatut(tache.id, e.target.value)}
                      aria-label={`Statut de ${tache.nom}`}
                    >
                      {STATUTS.map((item) => (
                        <option key={item.value} value={item.value}>{item.value}</option>
                      ))}
                    </select>
                  </td>
                  <td className="actions-cell">
                    <button className="btn-edit" type="button" onClick={() => preparerModification(tache)}>
                      Modifier
                    </button>
                    <button className="btn-delete" type="button" onClick={() => supprimerTache(tache.id)}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {tachesAffichees.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-row">
                    {taches.length === 0 ? "Aucune tâche pour le moment. Ajoutez votre première tâche." : "Aucune tâche ne correspond à ce filtre."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="footer">
        <span>TaskFlow</span>
        <span>Organisez vos tâches, avancez sereinement.</span>
      </footer>
    </main>
  );
}

export default App;
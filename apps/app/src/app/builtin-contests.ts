// Généré par scripts/make_builtin.py à partir de apps/api/prisma/seed-contests.json : ne pas modifier à la main.
// Concours intégrés à l'appli : disponibles en entraînement sans serveur ni connexion.
import type { BuiltinContest } from './api.service';

export const BUILTIN_CONTESTS: BuiltinContest[] = [
  {
    "id": "robee",
    "name": "RoBee, un robot pollinisateur",
    "season": "2018-2019",
    "description": "Défi RoBee, un robot pollinisateur (cycle 2). Pas de limite de temps : chronomètre libre (en tournoi, l'arbitre peut régler un minuteur). 5 points retirés par pénalité, 10 pénalités maximum.",
    "sheet": {
      "durationSeconds": 0,
      "penaltyPoints": 5,
      "maxPenalties": 10,
      "missions": [
        {
          "id": "m1",
          "title": "Mission 1 - Dépollution de la rivière",
          "description": "4 déchets maximum. Un déchet au niveau N d'une tour impose un déchet à chaque niveau en dessous (tour de 4 = 60 + 45 + 30 + 15). Pour chaque tour, cliquer sur son niveau le plus haut : les niveaux du dessous se comptent automatiquement (niveau 4 = la tour complète, 4 déchets).",
          "image": "assets/legacy/cycle2/logoMission/mission1.jpg",
          "items": [
            {
              "id": "n4",
              "type": "counter",
              "label": "Un déchet se trouve au niveau 4 d'une tour de compactage dans la déchetterie.",
              "images": [
                "assets/legacy/cycle2/explMission/dechetterie_mission1.jpg",
                "assets/legacy/cycle2/explMission/dechet_quatre.gif"
              ],
              "points": 60,
              "max": 1
            },
            {
              "id": "n3",
              "type": "counter",
              "label": "Un déchet se trouve au niveau 3 d'une tour de compactage dans la déchetterie.",
              "images": [
                "assets/legacy/cycle2/explMission/dechetterie_mission1.jpg",
                "assets/legacy/cycle2/explMission/dechet_trois.gif"
              ],
              "points": 45,
              "max": 1
            },
            {
              "id": "n2",
              "type": "counter",
              "label": "Un déchet se trouve au niveau 2 d'une tour de compactage dans la déchetterie.",
              "images": [
                "assets/legacy/cycle2/explMission/dechetterie_mission1.jpg",
                "assets/legacy/cycle2/explMission/dechet_deux.gif"
              ],
              "points": 30,
              "max": 2
            },
            {
              "id": "sol",
              "type": "counter",
              "label": "Un déchet se trouve sur le sol de la déchetterie.",
              "images": [
                "assets/legacy/cycle2/explMission/dechetterie_mission1.jpg",
                "assets/legacy/cycle2/explMission/dechet_seul.gif"
              ],
              "points": 15,
              "max": 4
            },
            {
              "id": "ecole",
              "type": "counter",
              "label": "Un déchet se trouve à l'école.",
              "images": [
                "assets/legacy/cycle2/explMission/école.jpg",
                "assets/legacy/cycle2/explMission/dechet_seul.gif"
              ],
              "points": 9,
              "max": 4
            },
            {
              "id": "autre",
              "type": "counter",
              "label": "Un déchet se trouve en dehors de la rivière mais ni à l'école ni à la déchetterie.",
              "image": "assets/legacy/cycle2/explMission/dechet_seul.gif",
              "points": 3,
              "max": 4
            }
          ],
          "maxObjects": {
            "items": [
              "n4",
              "n3",
              "n2",
              "sol",
              "ecole",
              "autre"
            ],
            "max": 4
          },
          "limits": [
            {
              "item": "n4",
              "notMoreThan": "n3"
            },
            {
              "item": "n3",
              "notMoreThan": "n2"
            },
            {
              "item": "n2",
              "notMoreThan": "sol"
            }
          ]
        },
        {
          "id": "m2",
          "title": "Mission 2 - Création d'un arboretum",
          "description": "4 graines maximum : dès que 4 graines sont comptées, les autres lignes se bloquent.",
          "image": "assets/legacy/cycle2/logoMission/mission2.jpg",
          "items": [
            {
              "id": "bonne-zone",
              "type": "counter",
              "label": "Une graine se trouve dans l'arboretum sur la bonne zone de couleur.",
              "image": "assets/legacy/cycle2/explMission/arboretum_bonne_place_mission2.jpg",
              "points": 30,
              "max": 4
            },
            {
              "id": "cour",
              "type": "counter",
              "label": "Une graine se trouve dans la cour de l'école.",
              "images": [
                "assets/legacy/cycle2/explMission/graine_verte.gif",
                "assets/legacy/cycle2/explMission/école.jpg"
              ],
              "points": 9,
              "max": 4
            },
            {
              "id": "mauvaise-zone",
              "type": "counter",
              "label": "Une graine se trouve dans l'arboretum sur la mauvaise zone de couleur.",
              "image": "assets/legacy/cycle2/explMission/arboretum_mauvaise_place_mission2.jpg",
              "points": 6,
              "max": 4
            },
            {
              "id": "pepiniere",
              "type": "counter",
              "label": "Une graine se trouve dans la pépinière.",
              "images": [
                "assets/legacy/cycle2/explMission/graine_verte.gif",
                "assets/legacy/cycle2/explMission/pépinière_mission2.jpg"
              ],
              "points": 3,
              "max": 4
            }
          ],
          "maxObjects": {
            "items": [
              "bonne-zone",
              "cour",
              "mauvaise-zone",
              "pepiniere"
            ],
            "max": 4
          }
        },
        {
          "id": "m3",
          "title": "Mission 3 - Passage du pont en chantant",
          "description": "RoBee doit passer le pont.",
          "image": "assets/legacy/cycle2/logoMission/mission3.jpg",
          "items": [
            {
              "id": "arret",
              "type": "check",
              "label": "RoBee s'est arrêté sur le pont.",
              "image": "assets/legacy/cycle2/explMission/pont-mission3.jpg",
              "points": 30
            },
            {
              "id": "structure",
              "type": "check",
              "label": "RoBee n'a pas touché la structure du pont.",
              "image": "assets/legacy/cycle2/explMission/pont-structure-mission3.jpg",
              "points": 30
            },
            {
              "id": "musique",
              "type": "check",
              "label": "RoBee a produit l'air de musique demandé.",
              "image": "assets/legacy/cycle2/explMission/jouer_melodie_mission3.jpg",
              "points": 30
            }
          ]
        },
        {
          "id": "m4",
          "title": "Mission 4 - Fabrication du miel",
          "description": "4 gouttes maximum. Une goutte au niveau N du pot impose une goutte à chaque niveau en dessous (niveau 4 = 60 + 45 + 30 + 15). Cliquer sur le niveau le plus haut de chaque pile : les niveaux du dessous se comptent automatiquement (niveau 4 = la pile complète, 4 gouttes).",
          "image": "assets/legacy/cycle2/logoMission/mission4.jpg",
          "items": [
            {
              "id": "n4",
              "type": "counter",
              "label": "Une goutte de nectar s'est transformée en miel et se trouve au niveau 4 du pot de miel.",
              "image": "assets/legacy/cycle2/explMission/4_pot_de_miel_mission4.jpg",
              "points": 60,
              "max": 1
            },
            {
              "id": "n3",
              "type": "counter",
              "label": "Une goutte de nectar s'est transformée en miel et se trouve au niveau 3 du pot de miel.",
              "image": "assets/legacy/cycle2/explMission/3_pot_de_miel_mission4.jpg",
              "points": 45,
              "max": 1
            },
            {
              "id": "n2",
              "type": "counter",
              "label": "Une goutte de nectar s'est transformée en miel et se trouve au niveau 2 du pot de miel.",
              "image": "assets/legacy/cycle2/explMission/2_pot_de_miel_mission4.jpg",
              "points": 30,
              "max": 2
            },
            {
              "id": "fond",
              "type": "counter",
              "label": "Une goutte de nectar s'est transformée en miel et se trouve au fond du pot de miel.",
              "image": "assets/legacy/cycle2/explMission/1_pot_de_miel_mission4.jpg",
              "points": 15,
              "max": 4
            },
            {
              "id": "ruche",
              "type": "counter",
              "label": "Une goutte de nectar se trouve dans la ruche.",
              "images": [
                "assets/legacy/cycle2/explMission/nectar_niveau1.jpg",
                "assets/legacy/cycle2/explMission/ruche.jpg"
              ],
              "points": 9,
              "max": 4
            },
            {
              "id": "jardin",
              "type": "counter",
              "label": "Une goutte de nectar se trouve dans le jardin anglais.",
              "images": [
                "assets/legacy/cycle2/explMission/nectar_niveau1.jpg",
                "assets/legacy/cycle2/explMission/jardin anglais.jpg"
              ],
              "points": 3,
              "max": 4
            }
          ],
          "maxObjects": {
            "items": [
              "n4",
              "n3",
              "n2",
              "fond",
              "ruche",
              "jardin"
            ],
            "max": 4
          },
          "limits": [
            {
              "item": "n4",
              "notMoreThan": "n3"
            },
            {
              "item": "n3",
              "notMoreThan": "n2"
            },
            {
              "item": "n2",
              "notMoreThan": "fond"
            }
          ]
        },
        {
          "id": "m5",
          "title": "Mission 5 - La danse du butineur",
          "description": "Lorsqu'il arrive dans la « Ruche », RoBee doit indiquer l'emplacement du jardin à ses congénères en effectuant une danse.",
          "image": "assets/legacy/cycle2/logoMission/mission5.jpg",
          "items": [
            {
              "id": "danse",
              "type": "choice",
              "label": "Danse de RoBee",
              "image": "assets/legacy/cycle2/explMission/RoBee_danse_mission5.jpg",
              "options": [
                {
                  "label": "RoBee a effectué une danse.",
                  "points": 15
                },
                {
                  "label": "RoBee a effectué une danse en forme de huit.",
                  "points": 30
                }
              ]
            }
          ]
        },
        {
          "id": "m6",
          "title": "Mission 6 - Protection des insectes pollinisateurs",
          "description": "RoBee doit être en sécurité pour passer la nuit.",
          "image": "assets/legacy/cycle2/logoMission/mission6.jpg",
          "items": [
            {
              "id": "abri",
              "type": "choice",
              "label": "Position de RoBee",
              "image": "assets/legacy/cycle2/explMission/RoBee-Ruche.jpg",
              "options": [
                {
                  "label": "RoBee se trouve dans la « Ruche ».",
                  "points": 30
                },
                {
                  "label": "RoBee se trouve dans l'hôtel à insectes situé dans l'école et il est éteint.",
                  "points": 60
                }
              ]
            }
          ]
        },
        {
          "id": "bonus-techno",
          "title": "Bonus technologique",
          "description": "Maximum 100 points. Jusqu'à 3 capteurs, 2 moteurs supplémentaires et 2 outils imprimés en 3D, à 20 points chacun ; ils doivent servir aux missions du défi.",
          "items": [
            {
              "id": "capteurs",
              "type": "counter",
              "label": "RoBee utilise des capteurs pour être plus autonome dans ses missions (tactile, de force, de lumière, de couleurs, à ultrasons, gyroscopique, de température, infrarouge...).",
              "points": 20,
              "max": 3
            },
            {
              "id": "moteurs",
              "type": "counter",
              "label": "RoBee utilise des moteurs supplémentaires pour une action autre que ses déplacements, en lien avec les missions.",
              "points": 20,
              "max": 2
            },
            {
              "id": "outils-3d",
              "type": "counter",
              "label": "RoBee utilise un outil fabriqué à l'aide d'une imprimante 3D.",
              "points": 20,
              "max": 2
            }
          ],
          "maxPoints": 100
        },
        {
          "id": "bonus-pedago",
          "title": "Bonus pédagogique",
          "description": "Maximum 100 points. Attitude de l'équipe pendant le défi (5 critères de 10 points) et affiche format raisin sur le stand (5 cadres de 10 points). Cocher un cadre coche aussi « affiche présente » ; sans affiche, les cadres ne comptent pas.",
          "items": [
            {
              "id": "att-respect",
              "type": "check",
              "points": 10,
              "label": "Attitude - Pendant le défi, les élèves de l'équipe respectent les lieux et le matériel mis à disposition de l'équipe pendant le temps du défi (robot, outils, ordinateurs, tablettes, tables, chaises, plateau de jeu, matériel d'affichage...)."
            },
            {
              "id": "att-roles",
              "type": "check",
              "points": 10,
              "label": "Attitude - Pendant le défi, les élèves de l'équipe chacun a un rôle bien défini pendant les tests et les matchs."
            },
            {
              "id": "att-arbitre",
              "type": "check",
              "points": 10,
              "label": "Attitude - Pendant le défi, les élèves de l'équipe prennent en compte les remarques de l'arbitre."
            },
            {
              "id": "att-perseverance",
              "type": "check",
              "points": 10,
              "label": "Attitude - Pendant le défi, les élèves de l'équipe apprécient le moment, sont positifs, s'encouragent, progressent et persévèrent pour réussir toutes les missions."
            },
            {
              "id": "att-autres-equipes",
              "type": "check",
              "points": 10,
              "label": "Attitude - Pendant le défi, les élèves de l'équipe respectent les autres équipes, partagent avec elles leur matériel, leurs connaissances et leurs solutions."
            },
            {
              "id": "affiche",
              "type": "check",
              "points": 0,
              "label": "Une affiche (format raisin) est présente sur le stand de l'équipe."
            },
            {
              "id": "a-presentation",
              "type": "check",
              "points": 10,
              "label": "Affiche - Cadre « NOTRE ÉQUIPE » : nom de l'équipe, classe, enseignant, école, niveau, photo de l'équipe avec son robot et rôle principal de chaque équipier."
            },
            {
              "id": "a-conception",
              "type": "check",
              "points": 10,
              "label": "Affiche - Cadre « NOTRE ROBOT » : schéma décrivant les fonctions du robot (brique programmable, capteurs, moteurs, outils, structures)."
            },
            {
              "id": "a-programmation",
              "type": "check",
              "points": 10,
              "label": "Affiche - Cadre « NOS PROGRAMMES » : parties significatives et commentées des programmes de l'équipe (boucle, sélecteur, capteurs...)."
            },
            {
              "id": "a-apports",
              "type": "check",
              "points": 10,
              "label": "Affiche - Cadre « LA ROBOTIQUE C'EST... » : au moins une phrase par élève sur ce que le projet lui a apporté."
            },
            {
              "id": "a-equipe",
              "type": "check",
              "points": 10,
              "label": "Affiche - Cadre « LE TRAVAIL EN ÉQUIPE » : importance du travail en équipe, rôle de chacun, état d'esprit, méthodes et outils de travail."
            }
          ],
          "limits": [
            {
              "item": "a-presentation",
              "notMoreThan": "affiche"
            },
            {
              "item": "a-conception",
              "notMoreThan": "affiche"
            },
            {
              "item": "a-programmation",
              "notMoreThan": "affiche"
            },
            {
              "item": "a-apports",
              "notMoreThan": "affiche"
            },
            {
              "item": "a-equipe",
              "notMoreThan": "affiche"
            }
          ]
        }
      ],
      "timeTiebreak": true
    }
  },
  {
    "id": "gardbot",
    "name": "Une nuit au musée avec GardBot",
    "season": "2018-2019",
    "description": "Défi « Une nuit au musée avec GardBot » (cycle 3). Pas de limite de temps : chronomètre libre (en tournoi, l'arbitre peut régler un minuteur). 5 points retirés par pénalité, 10 pénalités maximum.",
    "sheet": {
      "durationSeconds": 0,
      "penaltyPoints": 5,
      "missions": [
        {
          "id": "m1",
          "title": "Mission 1 - Dépose de la momie et de la tablette magique dans le sarcophage",
          "image": "assets/gardbot/m1-plan.jpg",
          "items": [
            {
              "id": "tablette",
              "type": "check",
              "label": "La tablette est dans le sarcophage.",
              "image": "assets/gardbot/m1-momie-tablette-sarcophage.jpg",
              "points": 20
            },
            {
              "id": "momie",
              "type": "choice",
              "label": "La momie",
              "images": [
                "assets/gardbot/m1-momie-tablette-sarcophage.jpg",
                "assets/gardbot/m1-momie-loge.jpg"
              ],
              "options": [
                {
                  "label": "est allongée dans le sarcophage.",
                  "points": 80
                },
                {
                  "label": "se trouve dans la loge de GardBot.",
                  "points": 50
                },
                {
                  "label": "se trouve à l'intérieur des couloirs du temps mais pas dans son sarcophage.",
                  "points": 20
                },
                {
                  "label": "Autre situation",
                  "points": 0
                }
              ]
            }
          ]
        },
        {
          "id": "m2",
          "title": "Mission 2 - Restitution de la galerie des personnages historiques",
          "description": "Nombre de personnages (4 maximum).",
          "image": "assets/gardbot/m2-plan.jpg",
          "items": [
            {
              "id": "debout",
              "type": "counter",
              "label": "Debout dans la vitrine de sa couleur de la galerie des personnages historiques.",
              "image": "assets/gardbot/m2-personnage-debout-vitrine.jpg",
              "points": 25,
              "max": 4
            },
            {
              "id": "couche",
              "type": "counter",
              "label": "Dans la vitrine de sa couleur mais pas debout.",
              "points": 15,
              "max": 4
            },
            {
              "id": "galerie",
              "type": "counter",
              "label": "Dans la galerie des personnages historiques mais pas dans la vitrine de sa couleur.",
              "points": 10,
              "max": 4
            },
            {
              "id": "atelier",
              "type": "counter",
              "label": "Dans l'atelier ou dans la loge de GardBot.",
              "points": 2,
              "max": 4
            },
            {
              "id": "dehors",
              "type": "counter",
              "label": "En dehors des couloirs du temps.",
              "points": 1,
              "max": 4
            }
          ],
          "maxObjects": {
            "items": [
              "debout",
              "couche",
              "galerie",
              "atelier",
              "dehors"
            ],
            "max": 4
          }
        },
        {
          "id": "m3",
          "title": "Mission 3 - Reconstruction de la statue de l'île de Pâques « Gum ! Gum ! »",
          "description": "10 blocs maximum. Si la statue est construite, ne remplir que les lignes « statue construite » (blocs au-dessus des blocs noirs) ; sinon, que les lignes « statue non construite ».",
          "image": "assets/gardbot/m3-plan.jpg",
          "items": [
            {
              "id": "c-socle",
              "type": "counter",
              "label": "Statue construite : blocs au-dessus des blocs noirs à l'intérieur du socle.",
              "image": "assets/gardbot/m3-statue.jpg",
              "points": 10,
              "max": 10
            },
            {
              "id": "c-salle",
              "type": "counter",
              "label": "Statue construite : blocs au-dessus des blocs noirs dans la salle de la statue.",
              "points": 8,
              "max": 10
            },
            {
              "id": "c-atelier",
              "type": "counter",
              "label": "Statue construite : blocs au-dessus des blocs noirs dans l'atelier.",
              "points": 6,
              "max": 10
            },
            {
              "id": "nc-salle",
              "type": "counter",
              "label": "Statue non construite : blocs dans la salle de la statue.",
              "image": "assets/gardbot/m3-blocs.jpg",
              "points": 3,
              "max": 10
            },
            {
              "id": "nc-atelier",
              "type": "counter",
              "label": "Statue non construite : blocs dans l'atelier.",
              "points": 2,
              "max": 10
            },
            {
              "id": "nc-dehors",
              "type": "counter",
              "label": "Statue non construite : blocs en dehors de l'auditorium.",
              "points": 1,
              "max": 10
            }
          ],
          "maxObjects": {
            "items": [
              "c-socle",
              "c-salle",
              "c-atelier",
              "nc-salle",
              "nc-atelier",
              "nc-dehors"
            ],
            "max": 10
          }
        },
        {
          "id": "m4",
          "title": "Mission 4 - Ré-aménagement de la salle des tableaux",
          "description": "Par tableau : 1 critère = 10 (20 pour le support seul), 2 critères = 30, 3 critères = 50.",
          "image": "assets/gardbot/m4-plan.jpg",
          "items": [
            {
              "id": "t1-oriente",
              "type": "check",
              "label": "Tableau 1 vertical : bien orienté.",
              "image": "assets/gardbot/m4-tableau-vertical-socle.png",
              "points": 10
            },
            {
              "id": "t1-place",
              "type": "check",
              "label": "Tableau 1 vertical : bien placé.",
              "points": 10
            },
            {
              "id": "t1-support",
              "type": "check",
              "label": "Tableau 1 vertical : sur son support (niveau expert).",
              "points": 20
            },
            {
              "id": "t2-oriente",
              "type": "check",
              "label": "Tableau 2 horizontal : bien orienté.",
              "image": "assets/gardbot/m4-tableau-horizontal-socle.png",
              "points": 10
            },
            {
              "id": "t2-place",
              "type": "check",
              "label": "Tableau 2 horizontal : bien placé.",
              "points": 10
            },
            {
              "id": "t2-support",
              "type": "check",
              "label": "Tableau 2 horizontal : sur son support (niveau expert).",
              "points": 20
            }
          ],
          "rules": [
            {
              "label": "Tableau 1 : orienté + placé = 30",
              "when": [
                {
                  "item": "t1-oriente",
                  "equals": true
                },
                {
                  "item": "t1-place",
                  "equals": true
                },
                {
                  "item": "t1-support",
                  "equals": false
                }
              ],
              "add": 10
            },
            {
              "label": "Tableau 1 : 3 critères = 50",
              "when": [
                {
                  "item": "t1-oriente",
                  "equals": true
                },
                {
                  "item": "t1-place",
                  "equals": true
                },
                {
                  "item": "t1-support",
                  "equals": true
                }
              ],
              "add": 10
            },
            {
              "label": "Tableau 2 : orienté + placé = 30",
              "when": [
                {
                  "item": "t2-oriente",
                  "equals": true
                },
                {
                  "item": "t2-place",
                  "equals": true
                },
                {
                  "item": "t2-support",
                  "equals": false
                }
              ],
              "add": 10
            },
            {
              "label": "Tableau 2 : 3 critères = 50",
              "when": [
                {
                  "item": "t2-oriente",
                  "equals": true
                },
                {
                  "item": "t2-place",
                  "equals": true
                },
                {
                  "item": "t2-support",
                  "equals": true
                }
              ],
              "add": 10
            }
          ]
        },
        {
          "id": "m5",
          "title": "Mission 5 - Création d'un morceau de musique",
          "description": "Ne remplir que si la mélodie a été entendue.",
          "image": "assets/gardbot/m5-plan.jpg",
          "items": [
            {
              "id": "quand",
              "type": "choice",
              "label": "La mélodie a été entendue",
              "options": [
                {
                  "label": "quand GardBot était à l'intérieur de l'auditorium.",
                  "points": 20
                },
                {
                  "label": "quand GardBot était à l'extérieur de l'auditorium.",
                  "points": 10
                }
              ]
            },
            {
              "id": "origine",
              "type": "choice",
              "label": "La mélodie est issue",
              "image": "assets/gardbot/m5-programme.jpg",
              "options": [
                {
                  "label": "du répertoire du robot.",
                  "points": 0
                },
                {
                  "label": "d'une carte musique tirée au sort par l'équipe.",
                  "points": 40
                },
                {
                  "label": "d'une mélodie composée par l'équipe.",
                  "points": 70
                }
              ]
            }
          ],
          "rules": [
            {
              "label": "Intérieur + mélodie composée = 100",
              "when": [
                {
                  "item": "quand",
                  "equals": 0
                },
                {
                  "item": "origine",
                  "equals": 2
                }
              ],
              "add": 10
            }
          ]
        },
        {
          "id": "m6",
          "title": "Mission 6 - Recharge des batteries de GardBot",
          "image": "assets/gardbot/m6-plan.jpg",
          "items": [
            {
              "id": "position",
              "type": "choice",
              "label": "GardBot se trouve",
              "options": [
                {
                  "label": "dans l'atelier.",
                  "points": 50
                },
                {
                  "label": "dans la loge.",
                  "points": 80
                },
                {
                  "label": "Autre situation.",
                  "points": 0
                }
              ]
            },
            {
              "id": "eteint",
              "type": "check",
              "label": "GardBot est éteint dans la loge du gardien.",
              "points": 0
            }
          ],
          "rules": [
            {
              "label": "Dans la loge et éteint = 100",
              "when": [
                {
                  "item": "position",
                  "equals": 1
                },
                {
                  "item": "eteint",
                  "equals": true
                }
              ],
              "add": 20
            }
          ]
        },
        {
          "id": "bonus-techno",
          "title": "Bonus technologique",
          "description": "Maximum 100 points. Jusqu'à 3 capteurs, 2 moteurs supplémentaires et 2 outils imprimés en 3D, à 20 points chacun ; ils doivent servir aux missions du défi.",
          "items": [
            {
              "id": "capteurs",
              "type": "counter",
              "label": "GardBot utilise des capteurs pour être plus autonome dans ses missions (tactile, de force, de lumière, de couleurs, à ultrasons, gyroscopique, de température, infrarouge...).",
              "points": 20,
              "max": 3
            },
            {
              "id": "moteurs",
              "type": "counter",
              "label": "GardBot utilise des moteurs supplémentaires pour une action autre que ses déplacements, en lien avec les missions.",
              "points": 20,
              "max": 2
            },
            {
              "id": "outils-3d",
              "type": "counter",
              "label": "GardBot utilise un outil fabriqué à l'aide d'une imprimante 3D.",
              "points": 20,
              "max": 2
            }
          ],
          "maxPoints": 100
        },
        {
          "id": "bonus-pedago",
          "title": "Bonus pédagogique",
          "description": "Maximum 100 points. Attitude de l'équipe pendant le défi (5 critères de 10 points) et affiche format raisin sur le stand (5 cadres de 10 points). Cocher un cadre coche aussi « affiche présente » ; sans affiche, les cadres ne comptent pas.",
          "items": [
            {
              "id": "att-respect",
              "type": "check",
              "points": 10,
              "label": "Attitude - Pendant le défi, les élèves de l'équipe respectent les lieux et le matériel mis à disposition de l'équipe pendant le temps du défi (robot, outils, ordinateurs, tablettes, tables, chaises, plateau de jeu, matériel d'affichage...)."
            },
            {
              "id": "att-roles",
              "type": "check",
              "points": 10,
              "label": "Attitude - Pendant le défi, les élèves de l'équipe chacun a un rôle bien défini pendant les tests et les matchs."
            },
            {
              "id": "att-arbitre",
              "type": "check",
              "points": 10,
              "label": "Attitude - Pendant le défi, les élèves de l'équipe prennent en compte les remarques de l'arbitre."
            },
            {
              "id": "att-perseverance",
              "type": "check",
              "points": 10,
              "label": "Attitude - Pendant le défi, les élèves de l'équipe apprécient le moment, sont positifs, s'encouragent, progressent et persévèrent pour réussir toutes les missions."
            },
            {
              "id": "att-autres-equipes",
              "type": "check",
              "points": 10,
              "label": "Attitude - Pendant le défi, les élèves de l'équipe respectent les autres équipes, partagent avec elles leur matériel, leurs connaissances et leurs solutions."
            },
            {
              "id": "affiche",
              "type": "check",
              "points": 0,
              "label": "Une affiche (format raisin) est présente sur le stand de l'équipe."
            },
            {
              "id": "a-presentation",
              "type": "check",
              "points": 10,
              "label": "Affiche - Cadre « NOTRE ÉQUIPE » : nom de l'équipe, classe, enseignant, école, niveau, photo de l'équipe avec son robot et rôle principal de chaque équipier."
            },
            {
              "id": "a-conception",
              "type": "check",
              "points": 10,
              "label": "Affiche - Cadre « NOTRE ROBOT » : schéma décrivant les fonctions du robot (brique programmable, capteurs, moteurs, outils, structures)."
            },
            {
              "id": "a-programmation",
              "type": "check",
              "points": 10,
              "label": "Affiche - Cadre « NOS PROGRAMMES » : parties significatives et commentées des programmes de l'équipe (boucle, sélecteur, capteurs...)."
            },
            {
              "id": "a-apports",
              "type": "check",
              "points": 10,
              "label": "Affiche - Cadre « LA ROBOTIQUE C'EST... » : au moins une phrase par élève sur ce que le projet lui a apporté."
            },
            {
              "id": "a-equipe",
              "type": "check",
              "points": 10,
              "label": "Affiche - Cadre « LE TRAVAIL EN ÉQUIPE » : importance du travail en équipe, rôle de chacun, état d'esprit, méthodes et outils de travail."
            }
          ],
          "limits": [
            {
              "item": "a-presentation",
              "notMoreThan": "affiche"
            },
            {
              "item": "a-conception",
              "notMoreThan": "affiche"
            },
            {
              "item": "a-programmation",
              "notMoreThan": "affiche"
            },
            {
              "item": "a-apports",
              "notMoreThan": "affiche"
            },
            {
              "item": "a-equipe",
              "notMoreThan": "affiche"
            }
          ]
        }
      ],
      "maxPenalties": 10,
      "timeTiebreak": true
    }
  },
  {
    "id": "mars2-cycle2",
    "name": "Mars II - cycle 2",
    "season": "2026-2027",
    "description": "Expédition Mars II : retour sur Mars\nLa précédente expédition sur Mars s'est mal terminée : la tour de contrôle est en panne, un robot s'est déréglé et plusieurs zones de la base sont devenues dangereuses. Votre équipe doit reprendre le contrôle : réactiver la tour de contrôle, neutraliser le robot défectueux, sécuriser la zone radioactive et se débarrasser de la roche radioactive. Ensuite, remettre en place l'émetteur, rejoindre la base et décoller.\n\nLe rover peut rouler dans la base (marron), le camp et la réserve (vert foncé et vert clair), le hangar (bleu) et sur le sol martien. Il doit absolument éviter le fossé (violet), la zone radioactive (jaune) et les deux cratères.\n\nMatériel cycle 2. Chaque mission peut être validée séparément ; le passage complet peut être chronométré (chronomètre libre, facultatif) : à égalité de points, le plus rapide l'emporte.\n\nPénalités : 5 points par pénalité, 10 pénalités maximum. 1 pénalité : rouler sur un cratère (nouvel essai depuis la base ou le camp, 4 tentatives maximum) ; toucher la tour de contrôle (elle est replacée) ; une roue touche le fossé violet ; une roue touche la zone radioactive ; rover retiré du tapis à la main ; rover sorti de sa zone de jeu ; la roche radioactive passe dans la base ; franchir totalement un fossé (interdit). Après une pénalité avec reprise à la main, le rover repart du hangar, de la base ou du camp. Un objet déplacé par erreur reste à sa nouvelle place. Les objets ne se bougent jamais à la main.",
    "sheet": {
      "durationSeconds": 0,
      "timeTiebreak": true,
      "penaltyPoints": 5,
      "maxPenalties": 10,
      "missions": [
        {
          "id": "m1",
          "title": "Mission 1 - Ravitaillement",
          "description": "Le rover part de la base et apporte les 4 provisions (2 caisses grises, 2 caisses de couleur) dans la réserve (vert clair) du camp, en évitant les cratères. Cycle 2 : il pousse les provisions jusqu'au camp. Toucher un cratère = 1 pénalité et reprise depuis la base. Maximum 100 points + bonus de 10 points.",
          "image": "assets/mars2027/m1-parcours.png",
          "items": [
            {
              "id": "reserve",
              "type": "counter",
              "label": "Une provision se trouve dans la réserve.",
              "image": "assets/mars2027/m1-caisses-reserve-cycle2.jpg",
              "points": 25,
              "max": 4
            },
            {
              "id": "camp",
              "type": "counter",
              "label": "Une provision se trouve dans le camp, mais pas dans la réserve.",
              "points": 15,
              "max": 4
            },
            {
              "id": "hors-base",
              "type": "counter",
              "label": "Une provision se trouve en dehors de la base (hors du fossé et de la zone radioactive).",
              "points": 5,
              "max": 4
            },
            {
              "id": "base",
              "type": "counter",
              "label": "Une provision se trouve sur le sol de la base.",
              "image": "assets/mars2027/m1-caisses-base.jpg",
              "points": 1,
              "max": 4
            },
            {
              "id": "empilee",
              "type": "check",
              "label": "Bonus : une provision est empilée dans la réserve (elle ne touche pas le sol).",
              "image": "assets/mars2027/m1-caisses-empilees.jpg",
              "points": 10
            }
          ],
          "maxObjects": {
            "items": [
              "reserve",
              "camp",
              "hors-base",
              "base"
            ],
            "max": 4
          }
        },
        {
          "id": "m2",
          "title": "Mission 2 - Neutraliser le robot défectueux",
          "description": "Faire tomber le robot défectueux (sur la croix bleue) avec le projectile qui se trouve dans le hangar. Cycle 2 : le rover pousse le projectile depuis le hangar et, en roulant, fait tomber le robot. Après un échec, une deuxième et dernière tentative est possible avec 1 pénalité (le rover retourne chercher le projectile au hangar). Noter le meilleur résultat. Maximum 100 points.",
          "image": "assets/mars2027/m2-plan.png",
          "items": [
            {
              "id": "resultat",
              "type": "choice",
              "label": "Résultat du lancer",
              "image": "assets/mars2027/m2-robot-tombe.jpg",
              "options": [
                {
                  "label": "Le robot défectueux est tombé.",
                  "points": 100
                },
                {
                  "label": "Le robot défectueux a été déplacé hors de la croix bleue sans tomber.",
                  "points": 75
                },
                {
                  "label": "Le projectile a touché le robot défectueux sans le déplacer.",
                  "points": 50
                },
                {
                  "label": "Le projectile a été poussé depuis le hangar sans toucher le robot défectueux.",
                  "points": 30
                },
                {
                  "label": "Autre situation (pas de lancer).",
                  "points": 0
                }
              ]
            }
          ]
        },
        {
          "id": "m3",
          "title": "Mission 3 - Réactiver la tour de contrôle",
          "description": "Le rover s'arrête sur les 4 lieux de réparation (ronds rouges) qui entourent la tour de contrôle. Chaque réparation = un bruit de quelques secondes : la note demandée (un DO). Compter chaque rond une seule fois, dans la ligne la plus haute atteinte (4 ronds maximum). Toucher la tour = 1 pénalité (elle est replacée). Maximum 100 points.",
          "image": "assets/mars2027/m3-plan.png",
          "items": [
            {
              "id": "note",
              "type": "counter",
              "label": "Le robot s'arrête sur un rond et joue la note demandée (un DO).",
              "image": "assets/mars2027/m3-tour-de-controle.jpg",
              "points": 25,
              "max": 4
            },
            {
              "id": "hasard",
              "type": "counter",
              "label": "Le robot s'arrête sur un rond et joue un bruitage au hasard.",
              "points": 15,
              "max": 4
            },
            {
              "id": "arret",
              "type": "counter",
              "label": "Le robot s'arrête sur le bon rond, sans bruitage.",
              "points": 10,
              "max": 4
            },
            {
              "id": "passage",
              "type": "counter",
              "label": "Le robot passe sur un rond sans s'arrêter.",
              "points": 5,
              "max": 4
            }
          ],
          "maxObjects": {
            "items": [
              "note",
              "hasard",
              "arret",
              "passage"
            ],
            "max": 4
          }
        },
        {
          "id": "m4",
          "title": "Mission 4 - Sécuriser la zone radioactive",
          "description": "Replacer les 2 barrières jaunes sur leurs emplacements marqués au sol (quadrillé jaune et blanc) à l'entrée de la zone radioactive. Cycle 2 : les emplacements sont parallèles aux barrières, les pousser peut suffire. Parfaitement placée = la barrière jaune (hors pieds gris) est entièrement au-dessus de la zone marquée. Compter chaque barrière une seule fois (2 maximum). Barrière non déplacée = 0 point. Maximum 100 points.",
          "image": "assets/mars2027/m4-plan.png",
          "items": [
            {
              "id": "parfaite",
              "type": "counter",
              "label": "Barrière parfaitement replacée dans la zone marquée, et droite.",
              "image": "assets/mars2027/m4-barrieres-zone-cycle2.jpg",
              "points": 50,
              "max": 2
            },
            {
              "id": "partielle-droite",
              "type": "counter",
              "label": "Barrière qui touche la zone marquée sans être parfaitement placée, et droite.",
              "points": 30,
              "max": 2
            },
            {
              "id": "partielle-tombee",
              "type": "counter",
              "label": "Barrière qui touche la zone marquée sans être parfaitement placée, mais tombée.",
              "points": 20,
              "max": 2
            },
            {
              "id": "deplacee",
              "type": "counter",
              "label": "Barrière déplacée mais qui ne touche pas la zone marquée.",
              "points": 10,
              "max": 2
            }
          ],
          "maxObjects": {
            "items": [
              "parfaite",
              "partielle-droite",
              "partielle-tombee",
              "deplacee"
            ],
            "max": 2
          }
        },
        {
          "id": "m5",
          "title": "Mission 5 - Se débarrasser de la roche radioactive",
          "description": "La roche radioactive part du pont. Le rover l'emmène dans la zone radioactive et la pousse à l'intérieur du cercle choisi (caisson). Le caisson 2 est le plus éloigné. Si la roche passe dans la base : 1 pénalité. Maximum 100 points.",
          "image": "assets/mars2027/m5-plan.png",
          "items": [
            {
              "id": "position",
              "type": "choice",
              "label": "La roche radioactive se trouve",
              "image": "assets/mars2027/m5-roche-caisson2-cycle2.jpg",
              "options": [
                {
                  "label": "dans le caisson (cercle) 2.",
                  "points": 100
                },
                {
                  "label": "dans le caisson (cercle) 1.",
                  "points": 75
                },
                {
                  "label": "dans la zone radioactive, mais pas dans un caisson.",
                  "points": 30
                },
                {
                  "label": "ailleurs, mais plus sur le pont.",
                  "points": 5
                },
                {
                  "label": "toujours sur le pont.",
                  "points": 0
                }
              ]
            }
          ]
        },
        {
          "id": "m6",
          "title": "Mission 6 - Placer l'émetteur et décoller",
          "description": "Le rover récupère l'émetteur dans le hangar, contourne la tour de contrôle et pousse l'émetteur jusque sur l'îlot, sans que ses roues touchent le fossé violet. Il rejoint ensuite la base et décolle avec un son de décollage de fusée. Maximum 100 points.",
          "image": "assets/mars2027/m6-plan.png",
          "items": [
            {
              "id": "emetteur",
              "type": "choice",
              "label": "Partie 1 - L'émetteur se trouve",
              "image": "assets/mars2027/m6-emetteur-ilot.jpg",
              "options": [
                {
                  "label": "sur le rond blanc de l'îlot, sans toucher le fossé violet.",
                  "points": 50
                },
                {
                  "label": "sur l'îlot, en touchant le fossé violet.",
                  "points": 30
                },
                {
                  "label": "en dehors du hangar, mais pas sur l'îlot.",
                  "points": 5
                },
                {
                  "label": "toujours dans le hangar.",
                  "points": 0
                }
              ]
            },
            {
              "id": "rover",
              "type": "choice",
              "label": "Partie 2 - Le rover",
              "options": [
                {
                  "label": "est à la base et décolle avec un son de décollage de fusée.",
                  "points": 50
                },
                {
                  "label": "est à la base, sans son de décollage.",
                  "points": 30
                },
                {
                  "label": "n'est pas à la base.",
                  "points": 0
                }
              ]
            }
          ]
        },
        {
          "id": "bonus-techno",
          "title": "Bonus technologique",
          "description": "Maximum 100 points. Jusqu'à 3 capteurs, 2 moteurs supplémentaires et 2 outils imprimés en 3D, à 20 points chacun ; ils doivent servir aux missions du défi.",
          "items": [
            {
              "id": "capteurs",
              "type": "counter",
              "label": "Le rover utilise des capteurs pour être plus autonome dans ses missions (tactile, de force, de lumière, de couleurs, à ultrasons, gyroscopique, de température, infrarouge...).",
              "points": 20,
              "max": 3
            },
            {
              "id": "moteurs",
              "type": "counter",
              "label": "Le rover utilise des moteurs supplémentaires pour une action autre que ses déplacements, en lien avec les missions.",
              "points": 20,
              "max": 2
            },
            {
              "id": "outils-3d",
              "type": "counter",
              "label": "Le rover utilise un outil fabriqué à l'aide d'une imprimante 3D.",
              "points": 20,
              "max": 2
            }
          ],
          "maxPoints": 100
        },
        {
          "id": "bonus-pedago",
          "title": "Bonus pédagogique",
          "description": "Maximum 100 points. Attitude de l'équipe pendant le défi (5 critères de 10 points) et affiche format raisin sur le stand (5 cadres de 10 points). Cocher un cadre coche aussi « affiche présente » ; sans affiche, les cadres ne comptent pas.",
          "items": [
            {
              "id": "att-respect",
              "type": "check",
              "points": 10,
              "label": "Attitude - Pendant le défi, les élèves de l'équipe respectent les lieux et le matériel mis à disposition de l'équipe pendant le temps du défi (robot, outils, ordinateurs, tablettes, tables, chaises, plateau de jeu, matériel d'affichage...)."
            },
            {
              "id": "att-roles",
              "type": "check",
              "points": 10,
              "label": "Attitude - Pendant le défi, les élèves de l'équipe chacun a un rôle bien défini pendant les tests et les matchs."
            },
            {
              "id": "att-arbitre",
              "type": "check",
              "points": 10,
              "label": "Attitude - Pendant le défi, les élèves de l'équipe prennent en compte les remarques de l'arbitre."
            },
            {
              "id": "att-perseverance",
              "type": "check",
              "points": 10,
              "label": "Attitude - Pendant le défi, les élèves de l'équipe apprécient le moment, sont positifs, s'encouragent, progressent et persévèrent pour réussir toutes les missions."
            },
            {
              "id": "att-autres-equipes",
              "type": "check",
              "points": 10,
              "label": "Attitude - Pendant le défi, les élèves de l'équipe respectent les autres équipes, partagent avec elles leur matériel, leurs connaissances et leurs solutions."
            },
            {
              "id": "affiche",
              "type": "check",
              "points": 0,
              "label": "Une affiche (format raisin) est présente sur le stand de l'équipe."
            },
            {
              "id": "a-presentation",
              "type": "check",
              "points": 10,
              "label": "Affiche - Cadre « NOTRE ÉQUIPE » : nom de l'équipe, classe, enseignant, école, niveau, photo de l'équipe avec son robot et rôle principal de chaque équipier."
            },
            {
              "id": "a-conception",
              "type": "check",
              "points": 10,
              "label": "Affiche - Cadre « NOTRE ROBOT » : schéma décrivant les fonctions du robot (brique programmable, capteurs, moteurs, outils, structures)."
            },
            {
              "id": "a-programmation",
              "type": "check",
              "points": 10,
              "label": "Affiche - Cadre « NOS PROGRAMMES » : parties significatives et commentées des programmes de l'équipe (boucle, sélecteur, capteurs...)."
            },
            {
              "id": "a-apports",
              "type": "check",
              "points": 10,
              "label": "Affiche - Cadre « LA ROBOTIQUE C'EST... » : au moins une phrase par élève sur ce que le projet lui a apporté."
            },
            {
              "id": "a-equipe",
              "type": "check",
              "points": 10,
              "label": "Affiche - Cadre « LE TRAVAIL EN ÉQUIPE » : importance du travail en équipe, rôle de chacun, état d'esprit, méthodes et outils de travail."
            }
          ],
          "limits": [
            {
              "item": "a-presentation",
              "notMoreThan": "affiche"
            },
            {
              "item": "a-conception",
              "notMoreThan": "affiche"
            },
            {
              "item": "a-programmation",
              "notMoreThan": "affiche"
            },
            {
              "item": "a-apports",
              "notMoreThan": "affiche"
            },
            {
              "item": "a-equipe",
              "notMoreThan": "affiche"
            }
          ]
        }
      ]
    }
  },
  {
    "id": "mars2-cycle3",
    "name": "Mars II - cycle 3",
    "season": "2026-2027",
    "description": "Expédition Mars II : retour sur Mars\nLa précédente expédition sur Mars s'est mal terminée : la tour de contrôle est en panne, un robot s'est déréglé et plusieurs zones de la base sont devenues dangereuses. Votre équipe doit reprendre le contrôle : réactiver la tour de contrôle, neutraliser le robot défectueux, sécuriser la zone radioactive et se débarrasser de la roche radioactive. Ensuite, remettre en place l'émetteur, rejoindre la base et décoller.\n\nLe rover peut rouler dans la base (marron), le camp et la réserve (vert foncé et vert clair), le hangar (bleu) et sur le sol martien. Il doit absolument éviter le fossé (violet), la zone radioactive (jaune) et les deux cratères.\n\nMatériel cycle 3. Chaque mission peut être validée séparément ; le passage complet peut être chronométré (chronomètre libre, facultatif) : à égalité de points, le plus rapide l'emporte.\n\nPénalités : 5 points par pénalité, 10 pénalités maximum. 1 pénalité : rouler sur un cratère (nouvel essai depuis la base ou le camp, 4 tentatives maximum) ; toucher la tour de contrôle (elle est replacée) ; une roue touche le fossé violet ; une roue touche la zone radioactive ; rover retiré du tapis à la main ; rover sorti de sa zone de jeu ; la roche radioactive passe dans la base ; franchir totalement un fossé (interdit). Après une pénalité avec reprise à la main, le rover repart du hangar, de la base ou du camp. Un objet déplacé par erreur reste à sa nouvelle place. Les objets ne se bougent jamais à la main.",
    "sheet": {
      "durationSeconds": 0,
      "timeTiebreak": true,
      "penaltyPoints": 5,
      "maxPenalties": 10,
      "missions": [
        {
          "id": "m1",
          "title": "Mission 1 - Ravitaillement",
          "description": "Le rover part de la base et apporte les 4 provisions (2 caisses grises, 2 caisses de couleur) dans la réserve (vert clair) du camp, en évitant les cratères. Cycle 3 : il les transporte et les dépose dans la réserve, derrière la barre grise. Toucher un cratère = 1 pénalité et reprise depuis la base. Maximum 100 points + bonus de 10 points.",
          "image": "assets/mars2027/m1-parcours.png",
          "items": [
            {
              "id": "reserve",
              "type": "counter",
              "label": "Une provision se trouve dans la réserve (derrière la barre grise).",
              "image": "assets/mars2027/m1-caisses-reserve-cycle3.jpg",
              "points": 25,
              "max": 4
            },
            {
              "id": "camp",
              "type": "counter",
              "label": "Une provision se trouve dans le camp, mais pas dans la réserve.",
              "points": 15,
              "max": 4
            },
            {
              "id": "hors-base",
              "type": "counter",
              "label": "Une provision se trouve en dehors de la base (hors du fossé et de la zone radioactive).",
              "points": 5,
              "max": 4
            },
            {
              "id": "base",
              "type": "counter",
              "label": "Une provision se trouve sur le sol de la base.",
              "image": "assets/mars2027/m1-caisses-base.jpg",
              "points": 1,
              "max": 4
            },
            {
              "id": "empilee",
              "type": "check",
              "label": "Bonus : une provision est empilée dans la réserve (elle ne touche pas le sol).",
              "image": "assets/mars2027/m1-caisses-empilees.jpg",
              "points": 10
            }
          ],
          "maxObjects": {
            "items": [
              "reserve",
              "camp",
              "hors-base",
              "base"
            ],
            "max": 4
          }
        },
        {
          "id": "m2",
          "title": "Mission 2 - Neutraliser le robot défectueux",
          "description": "Faire tomber le robot défectueux (sur la croix bleue) avec le projectile qui se trouve dans le hangar. Cycle 3 : le rover catapulte le projectile depuis la zone de tir. Après un échec, une deuxième et dernière tentative est possible avec 1 pénalité (le rover retourne chercher le projectile au hangar). Noter le meilleur résultat. Maximum 100 points.",
          "image": "assets/mars2027/m2-plan.png",
          "items": [
            {
              "id": "resultat",
              "type": "choice",
              "label": "Résultat du tir",
              "image": "assets/mars2027/m2-robot-tombe.jpg",
              "options": [
                {
                  "label": "Le robot défectueux est tombé.",
                  "points": 100
                },
                {
                  "label": "Le robot défectueux a été déplacé hors de la croix bleue sans tomber.",
                  "points": 75
                },
                {
                  "label": "Le projectile a touché le robot défectueux sans le déplacer.",
                  "points": 50
                },
                {
                  "label": "Le projectile a été tiré depuis la zone de tir sans toucher le robot défectueux.",
                  "points": 30
                },
                {
                  "label": "Autre situation (pas de tir).",
                  "points": 0
                }
              ]
            }
          ]
        },
        {
          "id": "m3",
          "title": "Mission 3 - Réactiver la tour de contrôle",
          "description": "Le rover s'arrête sur les 4 lieux de réparation (ronds rouges) qui entourent la tour de contrôle. Chaque réparation = un bruit de quelques secondes : la série de notes demandée (sol 4, la 4, fa 4, fa 3, do 4 : « Rencontres du troisième type »). Compter chaque rond une seule fois, dans la ligne la plus haute atteinte (4 ronds maximum). Toucher la tour = 1 pénalité (elle est replacée). Maximum 100 points.",
          "image": "assets/mars2027/m3-plan.png",
          "items": [
            {
              "id": "note",
              "type": "counter",
              "label": "Le robot s'arrête sur un rond et joue la série de notes demandée (sol 4, la 4, fa 4, fa 3, do 4 : « Rencontres du troisième type »).",
              "image": "assets/mars2027/m3-tour-de-controle.jpg",
              "points": 25,
              "max": 4
            },
            {
              "id": "hasard",
              "type": "counter",
              "label": "Le robot s'arrête sur un rond et joue un bruitage au hasard.",
              "points": 15,
              "max": 4
            },
            {
              "id": "arret",
              "type": "counter",
              "label": "Le robot s'arrête sur le bon rond, sans bruitage.",
              "points": 10,
              "max": 4
            },
            {
              "id": "passage",
              "type": "counter",
              "label": "Le robot passe sur un rond sans s'arrêter.",
              "points": 5,
              "max": 4
            }
          ],
          "maxObjects": {
            "items": [
              "note",
              "hasard",
              "arret",
              "passage"
            ],
            "max": 4
          }
        },
        {
          "id": "m4",
          "title": "Mission 4 - Sécuriser la zone radioactive",
          "description": "Replacer les 2 barrières jaunes sur leurs emplacements marqués au sol (quadrillé jaune et blanc) à l'entrée de la zone radioactive. Cycle 3 : une des deux barrières est placée perpendiculairement à son emplacement. Parfaitement placée = la barrière jaune (hors pieds gris) est entièrement au-dessus de la zone marquée. Compter chaque barrière une seule fois (2 maximum). Barrière non déplacée = 0 point. Maximum 100 points.",
          "image": "assets/mars2027/m4-plan.png",
          "items": [
            {
              "id": "parfaite",
              "type": "counter",
              "label": "Barrière parfaitement replacée dans la zone marquée, et droite.",
              "image": "assets/mars2027/m4-barrieres-zone-cycle3.jpg",
              "points": 50,
              "max": 2
            },
            {
              "id": "partielle-droite",
              "type": "counter",
              "label": "Barrière qui touche la zone marquée sans être parfaitement placée, et droite.",
              "points": 30,
              "max": 2
            },
            {
              "id": "partielle-tombee",
              "type": "counter",
              "label": "Barrière qui touche la zone marquée sans être parfaitement placée, mais tombée.",
              "points": 20,
              "max": 2
            },
            {
              "id": "deplacee",
              "type": "counter",
              "label": "Barrière déplacée mais qui ne touche pas la zone marquée.",
              "points": 10,
              "max": 2
            }
          ],
          "maxObjects": {
            "items": [
              "parfaite",
              "partielle-droite",
              "partielle-tombee",
              "deplacee"
            ],
            "max": 2
          }
        },
        {
          "id": "m5",
          "title": "Mission 5 - Se débarrasser de la roche radioactive",
          "description": "La roche radioactive part du pont. Le rover l'emmène dans la zone radioactive et la dépose dans le caisson (pneu) choisi. Le caisson 2 est le plus éloigné. Si la roche passe dans la base : 1 pénalité. Maximum 100 points.",
          "image": "assets/mars2027/m5-plan.png",
          "items": [
            {
              "id": "position",
              "type": "choice",
              "label": "La roche radioactive se trouve",
              "image": "assets/mars2027/m5-roche-caisson2-cycle3.jpg",
              "options": [
                {
                  "label": "dans le caisson (pneu) 2.",
                  "points": 100
                },
                {
                  "label": "dans le caisson (pneu) 1.",
                  "points": 75
                },
                {
                  "label": "dans la zone radioactive, mais pas dans un caisson.",
                  "points": 30
                },
                {
                  "label": "ailleurs, mais plus sur le pont.",
                  "points": 5
                },
                {
                  "label": "toujours sur le pont.",
                  "points": 0
                }
              ]
            }
          ]
        },
        {
          "id": "m6",
          "title": "Mission 6 - Placer l'émetteur et décoller",
          "description": "Le rover récupère l'émetteur dans le hangar, contourne la tour de contrôle et soulève l'émetteur pour le poser sur le socle blanc de l'îlot, sans que ses roues touchent le fossé violet. Il rejoint ensuite la base et décolle avec un son de décollage de fusée. Maximum 100 points.",
          "image": "assets/mars2027/m6-plan.png",
          "items": [
            {
              "id": "emetteur",
              "type": "choice",
              "label": "Partie 1 - L'émetteur se trouve",
              "image": "assets/mars2027/m6-emetteur-ilot.jpg",
              "options": [
                {
                  "label": "sur le socle blanc de l'îlot, sans toucher le fossé violet.",
                  "points": 50
                },
                {
                  "label": "sur l'îlot, en touchant le fossé violet.",
                  "points": 30
                },
                {
                  "label": "en dehors du hangar, mais pas sur l'îlot.",
                  "points": 5
                },
                {
                  "label": "toujours dans le hangar.",
                  "points": 0
                }
              ]
            },
            {
              "id": "rover",
              "type": "choice",
              "label": "Partie 2 - Le rover",
              "options": [
                {
                  "label": "est à la base et décolle avec un son de décollage de fusée.",
                  "points": 50
                },
                {
                  "label": "est à la base, sans son de décollage.",
                  "points": 30
                },
                {
                  "label": "n'est pas à la base.",
                  "points": 0
                }
              ]
            }
          ]
        },
        {
          "id": "bonus-techno",
          "title": "Bonus technologique",
          "description": "Maximum 100 points. Jusqu'à 3 capteurs, 2 moteurs supplémentaires et 2 outils imprimés en 3D, à 20 points chacun ; ils doivent servir aux missions du défi.",
          "items": [
            {
              "id": "capteurs",
              "type": "counter",
              "label": "Le rover utilise des capteurs pour être plus autonome dans ses missions (tactile, de force, de lumière, de couleurs, à ultrasons, gyroscopique, de température, infrarouge...).",
              "points": 20,
              "max": 3
            },
            {
              "id": "moteurs",
              "type": "counter",
              "label": "Le rover utilise des moteurs supplémentaires pour une action autre que ses déplacements, en lien avec les missions.",
              "points": 20,
              "max": 2
            },
            {
              "id": "outils-3d",
              "type": "counter",
              "label": "Le rover utilise un outil fabriqué à l'aide d'une imprimante 3D.",
              "points": 20,
              "max": 2
            }
          ],
          "maxPoints": 100
        },
        {
          "id": "bonus-pedago",
          "title": "Bonus pédagogique",
          "description": "Maximum 100 points. Attitude de l'équipe pendant le défi (5 critères de 10 points) et affiche format raisin sur le stand (5 cadres de 10 points). Cocher un cadre coche aussi « affiche présente » ; sans affiche, les cadres ne comptent pas.",
          "items": [
            {
              "id": "att-respect",
              "type": "check",
              "points": 10,
              "label": "Attitude - Pendant le défi, les élèves de l'équipe respectent les lieux et le matériel mis à disposition de l'équipe pendant le temps du défi (robot, outils, ordinateurs, tablettes, tables, chaises, plateau de jeu, matériel d'affichage...)."
            },
            {
              "id": "att-roles",
              "type": "check",
              "points": 10,
              "label": "Attitude - Pendant le défi, les élèves de l'équipe chacun a un rôle bien défini pendant les tests et les matchs."
            },
            {
              "id": "att-arbitre",
              "type": "check",
              "points": 10,
              "label": "Attitude - Pendant le défi, les élèves de l'équipe prennent en compte les remarques de l'arbitre."
            },
            {
              "id": "att-perseverance",
              "type": "check",
              "points": 10,
              "label": "Attitude - Pendant le défi, les élèves de l'équipe apprécient le moment, sont positifs, s'encouragent, progressent et persévèrent pour réussir toutes les missions."
            },
            {
              "id": "att-autres-equipes",
              "type": "check",
              "points": 10,
              "label": "Attitude - Pendant le défi, les élèves de l'équipe respectent les autres équipes, partagent avec elles leur matériel, leurs connaissances et leurs solutions."
            },
            {
              "id": "affiche",
              "type": "check",
              "points": 0,
              "label": "Une affiche (format raisin) est présente sur le stand de l'équipe."
            },
            {
              "id": "a-presentation",
              "type": "check",
              "points": 10,
              "label": "Affiche - Cadre « NOTRE ÉQUIPE » : nom de l'équipe, classe, enseignant, école, niveau, photo de l'équipe avec son robot et rôle principal de chaque équipier."
            },
            {
              "id": "a-conception",
              "type": "check",
              "points": 10,
              "label": "Affiche - Cadre « NOTRE ROBOT » : schéma décrivant les fonctions du robot (brique programmable, capteurs, moteurs, outils, structures)."
            },
            {
              "id": "a-programmation",
              "type": "check",
              "points": 10,
              "label": "Affiche - Cadre « NOS PROGRAMMES » : parties significatives et commentées des programmes de l'équipe (boucle, sélecteur, capteurs...)."
            },
            {
              "id": "a-apports",
              "type": "check",
              "points": 10,
              "label": "Affiche - Cadre « LA ROBOTIQUE C'EST... » : au moins une phrase par élève sur ce que le projet lui a apporté."
            },
            {
              "id": "a-equipe",
              "type": "check",
              "points": 10,
              "label": "Affiche - Cadre « LE TRAVAIL EN ÉQUIPE » : importance du travail en équipe, rôle de chacun, état d'esprit, méthodes et outils de travail."
            }
          ],
          "limits": [
            {
              "item": "a-presentation",
              "notMoreThan": "affiche"
            },
            {
              "item": "a-conception",
              "notMoreThan": "affiche"
            },
            {
              "item": "a-programmation",
              "notMoreThan": "affiche"
            },
            {
              "item": "a-apports",
              "notMoreThan": "affiche"
            },
            {
              "item": "a-equipe",
              "notMoreThan": "affiche"
            }
          ]
        }
      ]
    }
  }
];

export const builtinContest = (id: string) => BUILTIN_CONTESTS.find((c) => c.id === id);

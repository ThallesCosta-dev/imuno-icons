import { IconItem } from './iconData';

// Dividido em subcategorias
export const organSystemIcons: IconItem[] = [
  { id: "HumanAnatomy", url: "/files/anatomy/HumanAnatomy0001.svg" },
  { id: "HumanHeart", url: "/files/anatomy/HumanHeart0001.svg" },
  { id: "HumanDigestiveTract", url: "/files/anatomy/HumanDigestiveTract0001.svg" },
  { id: "HumanLungs", url: "/files/anatomy/HumanLungs0001.svg" },
  { id: "HumanUpperRespiratoryTract", url: "/files/anatomy/HumanUpperRespiratoryTract0001.svg" },
  { id: "HumanLiver", url: "/files/anatomy/HumanLiver.svg" },
  { id: "HumanKidney", url: "/files/anatomy/HumanKidney.svg" },
  { id: "HumanPancreas", url: "/files/anatomy/HumanPancreas.svg" },
  { id: "HumanSpleen", url: "/files/anatomy/Human Spleen.svg" },
  { id: "Tonsils", url: "/files/anatomy/Tonsils0001.svg" },
  { id: "InnerEar", url: "/files/anatomy/InnerEar.svg" },
  { id: "BrainLateral", url: "/files/anatomy/Brain Lateral.svg" },
];

export const skeletalSystemIcons: IconItem[] = [
  { id: "HumanUpperLegBones", url: "/files/anatomy/HumanUpperLegBones0001.svg" },
  { id: "HumanArmBones", url: "/files/anatomy/HumanArmBones0001.svg" },
];

export const reproductiveSystemIcons: IconItem[] = [
  { id: "PregnantHuman0001", url: "/files/anatomy/PregnantHuman0001.svg" },
  { id: "PregnantHuman0002", url: "/files/anatomy/PregnantHuman0002.svg" },
  { id: "PregnantMouse", url: "/files/anatomy/Pregnant Mouse.svg" },
  { id: "PlacentaCellularCrossSection", url: "/files/anatomy/Placenta Cellular Cross Section.svg" },
  { id: "MousePlacenta", url: "/files/anatomy/MousePlacenta0001.svg" },
  { id: "MaleSymbol", url: "/files/anatomy/MaleSymbol0001.svg" },
  { id: "MaleMouseWithTestes", url: "/files/anatomy/MaleMousewithTestes.svg" },
];

export const circulatorySystemIcons: IconItem[] = [
  { id: "BloodVessel", url: "/files/anatomy/BloodVessel.svg" },
  { id: "ArterioleCrossSection", url: "/files/anatomy/Arteriole Cross Section.svg" },
  { id: "ArterioleCrossSection1", url: "/files/anatomy/Arteriole Cross Section1.svg" },
  { id: "ArterioleCrossSection2", url: "/files/anatomy/Arteriole Cross Section2.svg" },
  { id: "VenuleCrossSection", url: "/files/anatomy/VenuleCrossSection0001.svg" },
];

export const lymphaticSystemIcons: IconItem[] = [
  { id: "LymphNode", url: "/files/anatomy/LymphNode.svg" },
  { id: "LymphNodeFull", url: "/files/anatomy/Lymph Node.svg" },
  { id: "BoneMarrow", url: "/files/anatomy/Bone Marrow.svg" },
  { id: "ThymusLobule", url: "/files/anatomy/Thymus Lobule.svg" },
  { id: "WhitePulp", url: "/files/anatomy/White Pulp.svg" },
  { id: "RedPulp", url: "/files/anatomy/Red Pulp.svg" },
];

export const cellularStructuresIcons: IconItem[] = [
  { id: "MaleMouseWithBrain", url: "/files/anatomy/MaleMousewithBrain.svg" },
  { id: "SweatGlandCrossSection", url: "/files/anatomy/Sweat Gland Cross Section.svg" },
  { id: "InflamedSkin", url: "/files/anatomy/Inflamed Skin.svg" },
  { id: "ChronicMucocutaneousCandidiasis", url: "/files/anatomy/Chronic Mucocutaneous Candidiasis.svg" },
  { id: "IntercalatedDuct", url: "/files/anatomy/Intercalated Duct.svg" },
  { id: "PulmonaryAlveolus", url: "/files/anatomy/Pulmonary Alveolus.svg" },
  { id: "CryptOfLieberkuhn", url: "/files/anatomy/Crypt of Lieberkuhn.svg" },
  { id: "OuterMedullaryCollectingDuct", url: "/files/anatomy/Outer Medullary Collecting Duct.svg" },
  { id: "Nephron", url: "/files/anatomy/Nephron.svg" },
  { id: "CorticalCollectingDuct", url: "/files/anatomy/Cortical Collecting Duct.svg" },
  { id: "ProstateGlandularAcinus", url: "/files/anatomy/Prostate Glandular Acinus.svg" },
  { id: "IsletsOfLangerhans", url: "/files/anatomy/Islets of Langerhans.svg" },
  { id: "BronchialSubmucosalGland", url: "/files/anatomy/Bronchial Submucosal Gland.svg" },
  { id: "LiverLobule", url: "/files/anatomy/Liver Lobule.svg" },
  { id: "ThickAscendingLimb", url: "/files/anatomy/Thick Ascending Limb of Loop of Henle.svg" },
  { id: "RenalCorpuscle", url: "/files/anatomy/Renal Corpuscle.svg" },
  { id: "InnerMedullaryCollectingDuct", url: "/files/anatomy/Inner Medullary Collecting Duct.svg" },
  { id: "DescendingThinLimb", url: "/files/anatomy/Descending Thin Limb of Loop of Henle.svg" },
  { id: "IntestinalVillus", url: "/files/anatomy/Intestinal Villus.svg" },
  { id: "EpidermalRidge", url: "/files/anatomy/Epidermal Ridge.svg" },
  { id: "DermalPapilla", url: "/files/anatomy/Dermal Papilla.svg" },
  { id: "AcinusPancreas", url: "/files/anatomy/Acinus (Pancreas).svg" },
  { id: "AscendingThinLimb", url: "/files/anatomy/Ascending Thin Limb of Loop of Henle.svg" },
];


const anatomyIcons = {
  "Organ System": organSystemIcons,
  "Skeletal System": skeletalSystemIcons,
  "Reproductive System": reproductiveSystemIcons,
  "Circulatory System": circulatorySystemIcons,
  "Lymphatic System": lymphaticSystemIcons,
  "Cellular Structures": cellularStructuresIcons
};

export default anatomyIcons; 
#!/bin/sh

set -eu

ROOT_DIR="${SRCROOT}/.."
WARDROBE_JSON="${ROOT_DIR}/data/generated/wardrobe.generated.json"
SOURCE_DIR="${ROOT_DIR}/data/generated/images"
DEST_DIR="${TARGET_BUILD_DIR}/${UNLOCALIZED_RESOURCES_FOLDER_PATH}/GeneratedWardrobeImages"
WARDROBE_DEST_DIR="${TARGET_BUILD_DIR}/${UNLOCALIZED_RESOURCES_FOLDER_PATH}/BundledWardrobe"
CURATED_PORTRAIT_SOURCE_DIR="${ROOT_DIR}/data/curated/look-portraits"
CURATED_PORTRAIT_DEST_DIR="${TARGET_BUILD_DIR}/${UNLOCALIZED_RESOURCES_FOLDER_PATH}/CuratedLookPortraits"
REFERENCE_SOURCE_DIR="${ROOT_DIR}/data/reference"
REFERENCE_DEST_DIR="${TARGET_BUILD_DIR}/${UNLOCALIZED_RESOURCES_FOLDER_PATH}/BundledReferencePortrait"

rm -rf "${DEST_DIR}"
mkdir -p "${DEST_DIR}"
rm -rf "${WARDROBE_DEST_DIR}"
mkdir -p "${WARDROBE_DEST_DIR}"
rm -rf "${CURATED_PORTRAIT_DEST_DIR}"
mkdir -p "${CURATED_PORTRAIT_DEST_DIR}"

if [ ! -f "${WARDROBE_JSON}" ] || [ ! -d "${SOURCE_DIR}" ]; then
  echo "Skipping wardrobe image sync: generated wardrobe data not found."
  exit 0
fi

grep -o 'generated-assets/[^"]*' "${WARDROBE_JSON}" | sed 's#generated-assets/##' | sort -u | while IFS= read -r image_name; do
  [ -n "${image_name}" ] || continue

  if [ -f "${SOURCE_DIR}/${image_name}" ]; then
    cp "${SOURCE_DIR}/${image_name}" "${DEST_DIR}/${image_name}"
  else
    echo "warning: missing wardrobe image ${image_name}"
  fi
done

count=$(find "${DEST_DIR}" -type f | wc -l | tr -d ' ')
echo "Bundled ${count} wardrobe images into app resources."

cp "${WARDROBE_JSON}" "${WARDROBE_DEST_DIR}/wardrobe.generated.json"
echo "Bundled wardrobe.generated.json into app resources."

if [ -d "${CURATED_PORTRAIT_SOURCE_DIR}" ]; then
  find "${CURATED_PORTRAIT_SOURCE_DIR}" -type f \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' \) | while IFS= read -r portrait_path; do
    portrait_name=$(basename "${portrait_path}")
    cp "${portrait_path}" "${CURATED_PORTRAIT_DEST_DIR}/${portrait_name}"
  done
fi

portrait_count=$(find "${CURATED_PORTRAIT_DEST_DIR}" -type f | wc -l | tr -d ' ')
echo "Bundled ${portrait_count} curated look portraits into app resources."

mkdir -p "${REFERENCE_DEST_DIR}"
reference_bundled=0

if [ -n "${OOTD_MODEL_REFERENCE_IMAGE_PATH:-}" ] && [ -f "${OOTD_MODEL_REFERENCE_IMAGE_PATH}" ]; then
  reference_name=$(basename "${OOTD_MODEL_REFERENCE_IMAGE_PATH}")
  cp "${OOTD_MODEL_REFERENCE_IMAGE_PATH}" "${REFERENCE_DEST_DIR}/${reference_name}"
  echo "Bundled preset reference portrait ${reference_name} from OOTD_MODEL_REFERENCE_IMAGE_PATH."
  reference_bundled=1
fi

for reference_name in model-reference.jpg model-reference.jpeg model-reference.png reference.jpg reference.jpeg reference.png; do
  [ "${reference_bundled}" -eq 0 ] || break
  if [ -f "${REFERENCE_SOURCE_DIR}/${reference_name}" ]; then
    cp "${REFERENCE_SOURCE_DIR}/${reference_name}" "${REFERENCE_DEST_DIR}/${reference_name}"
    echo "Bundled preset reference portrait ${reference_name} into app resources."
    reference_bundled=1
    break
  fi
done

if [ "${reference_bundled}" -eq 0 ]; then
  echo "No preset reference portrait found under data/reference."
fi
